-- ============================================
-- Script de Configuración de Base de Datos
-- Sistema de Gestión de Pedidos - Hnos. Pienda
-- Menú Real para Cenas Navideñas
-- ============================================

-- Eliminar tablas existentes si existen (para actualizar el esquema)
DROP TABLE IF EXISTS items_pedido CASCADE;
DROP TABLE IF EXISTS pedidos CASCADE;
DROP TABLE IF EXISTS variantes_menu CASCADE;
DROP TABLE IF EXISTS items_menu CASCADE;

-- Tabla: items_menu
-- Almacena los items del menú disponibles
CREATE TABLE items_menu (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('entradas', 'platos_fuertes', 'postres_bebidas')),
  unidad_medida TEXT NOT NULL, -- 'pz', 'kg', 'litro', 'tamaño'
  precio_base DECIMAL(10, 2), -- Precio base (puede ser NULL si depende de variante)
  tipo_variante TEXT, -- 'sabor', 'tamaño', 'salsa', 'relleno', NULL
  activo BOOLEAN DEFAULT true,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: variantes_menu
-- Almacena las variantes de cada item (tamaños, sabores, salsas, rellenos)
CREATE TABLE variantes_menu (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_menu_id UUID NOT NULL REFERENCES items_menu(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  precio DECIMAL(10, 2), -- Precio específico de la variante (opcional)
  descripcion TEXT,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: pedidos
-- Almacena la información principal de cada pedido
CREATE TABLE pedidos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_pedido TEXT UNIQUE NOT NULL,
  cliente TEXT NOT NULL,
  origen TEXT NOT NULL CHECK (origen IN ('Facebook', 'WhatsApp', 'Instagram', 'Referido', 'Otro')),
  telefono TEXT NOT NULL,
  horario_entrega TIME NOT NULL,
  anticipo DECIMAL(10, 2) DEFAULT 0,
  restante DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) DEFAULT 0,
  metodo_pago TEXT CHECK (metodo_pago IN ('efectivo', 'transferencia', 'pendiente')),
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_preparacion', 'completado')),
  notas TEXT,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla: items_pedido
-- Almacena los items específicos de cada pedido
CREATE TABLE items_pedido (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  item_menu_id UUID NOT NULL REFERENCES items_menu(id),
  variante_id UUID REFERENCES variantes_menu(id),
  salsa_id UUID REFERENCES variantes_menu(id), -- Para items con salsa adicional
  cantidad DECIMAL(10, 2) NOT NULL,
  precio_unitario DECIMAL(10, 2) NOT NULL, -- Precio al momento del pedido
  subtotal DECIMAL(10, 2) NOT NULL, -- cantidad * precio_unitario
  notas TEXT,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_items_menu_categoria ON items_menu(categoria);
CREATE INDEX IF NOT EXISTS idx_items_menu_activo ON items_menu(activo);
CREATE INDEX IF NOT EXISTS idx_variantes_menu_item ON variantes_menu(item_menu_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_horario ON pedidos(horario_entrega);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado);
CREATE INDEX IF NOT EXISTS idx_items_pedido_pedido ON items_pedido(pedido_id);

-- Función para generar número de pedido automático
CREATE OR REPLACE FUNCTION generar_numero_pedido()
RETURNS TRIGGER AS $$
DECLARE
  nuevo_numero TEXT;
  ultimo_numero INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(numero_pedido AS INTEGER)), 0) INTO ultimo_numero
  FROM pedidos
  WHERE numero_pedido ~ '^[0-9]+$';
  
  nuevo_numero := LPAD((ultimo_numero + 1)::TEXT, 3, '0');
  NEW.numero_pedido := nuevo_numero;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para generar número de pedido automáticamente
DROP TRIGGER IF EXISTS trigger_generar_numero_pedido ON pedidos;
CREATE TRIGGER trigger_generar_numero_pedido
  BEFORE INSERT ON pedidos
  FOR EACH ROW
  WHEN (NEW.numero_pedido IS NULL OR NEW.numero_pedido = '')
  EXECUTE FUNCTION generar_numero_pedido();

-- Función RPC para crear pedido de forma atómica (Transacción)
CREATE OR REPLACE FUNCTION crear_pedido_completo(
  pedido_data JSONB,
  items_data JSONB
) RETURNS JSONB AS $$
DECLARE
  v_pedido_id UUID;
  v_result JSONB;
BEGIN
  -- 1. Insertar el Pedido
  INSERT INTO pedidos (
    cliente, origen, telefono, horario_entrega,
    anticipo, restante, total, metodo_pago, estado, notas
  ) VALUES (
    pedido_data->>'cliente',
    pedido_data->>'origen',
    pedido_data->>'telefono',
    (pedido_data->>'horario_entrega')::TIME,
    (pedido_data->>'anticipo')::DECIMAL,
    (pedido_data->>'restante')::DECIMAL,
    (pedido_data->>'total')::DECIMAL,
    pedido_data->>'metodo_pago',
    pedido_data->>'estado',
    pedido_data->>'notas'
  ) RETURNING id INTO v_pedido_id;

  -- 2. Insertar los Items
  INSERT INTO items_pedido (
    pedido_id, item_menu_id, variante_id, salsa_id,
    cantidad, precio_unitario, subtotal, notas
  )
  SELECT
    v_pedido_id,
    (item->>'item_menu_id')::UUID,
    (CASE WHEN item->>'variante_id' = '' THEN NULL ELSE (item->>'variante_id')::UUID END),
    (CASE WHEN item->>'salsa_id' = '' THEN NULL ELSE (item->>'salsa_id')::UUID END),
    (item->>'cantidad')::DECIMAL,
    (item->>'precio_unitario')::DECIMAL,
    (item->>'subtotal')::DECIMAL,
    item->>'notas'
  FROM jsonb_array_elements(items_data) AS item;

  -- 3. Retornar el pedido creado
  SELECT to_jsonb(t) INTO v_result FROM pedidos t WHERE id = v_pedido_id;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- MENÚ COMPLETO DE HNOS. PIENDA
-- ============================================

-- ============================================
-- ENTRADAS Y GUARNICIONES
-- ============================================

-- Empanadas Argentinas ($60 por pieza)
INSERT INTO items_menu (nombre, categoria, unidad_medida, precio_base, tipo_variante) VALUES
  ('Empanadas Argentinas', 'entradas', 'pz', 60.00, 'sabor');

INSERT INTO variantes_menu (item_menu_id, nombre) VALUES
  ((SELECT id FROM items_menu WHERE nombre = 'Empanadas Argentinas'), 'Campiranas'),
  ((SELECT id FROM items_menu WHERE nombre = 'Empanadas Argentinas'), 'Elote'),
  ((SELECT id FROM items_menu WHERE nombre = 'Empanadas Argentinas'), 'Choriqueso');

-- Pastas por kilo
INSERT INTO items_menu (nombre, categoria, unidad_medida, tipo_variante) VALUES
  ('Pasta', 'entradas', 'kg', 'sabor');

INSERT INTO variantes_menu (item_menu_id, nombre, precio) VALUES
  ((SELECT id FROM items_menu WHERE nombre = 'Pasta'), 'A la Crema', 240.00),
  ((SELECT id FROM items_menu WHERE nombre = 'Pasta'), 'Hawaiano', 240.00),
  ((SELECT id FROM items_menu WHERE nombre = 'Pasta'), 'Boloñesa', 280.00);

-- Cremas por litro ($260)
INSERT INTO items_menu (nombre, categoria, unidad_medida, precio_base, tipo_variante) VALUES
  ('Crema', 'entradas', 'litro', 260.00, 'sabor');

INSERT INTO variantes_menu (item_menu_id, nombre) VALUES
  ((SELECT id FROM items_menu WHERE nombre = 'Crema'), 'Nuez'),
  ((SELECT id FROM items_menu WHERE nombre = 'Crema'), 'Papa con Queso'),
  ((SELECT id FROM items_menu WHERE nombre = 'Crema'), 'Elote');

-- Guarniciones por kilo ($260)
INSERT INTO items_menu (nombre, categoria, unidad_medida, precio_base) VALUES
  ('Puré de Papa Gratinado', 'entradas', 'kg', 260.00),
  ('Puré de Manzana', 'entradas', 'kg', 260.00),
  ('Betabel Rostizado', 'entradas', 'kg', 260.00),
  ('Ejotes Salteados', 'entradas', 'kg', 260.00);

-- Ensaladas por tamaño
INSERT INTO items_menu (nombre, categoria, unidad_medida, tipo_variante) VALUES
  ('Ensalada Frutal', 'entradas', 'tamaño', 'tamaño'),
  ('Ensalada de Jitomate', 'entradas', 'tamaño', 'tamaño');

INSERT INTO variantes_menu (item_menu_id, nombre, precio) VALUES
  ((SELECT id FROM items_menu WHERE nombre = 'Ensalada Frutal'), 'Mediana', 240.00),
  ((SELECT id FROM items_menu WHERE nombre = 'Ensalada Frutal'), 'Grande', 460.00),
  ((SELECT id FROM items_menu WHERE nombre = 'Ensalada de Jitomate'), 'Mediana', 240.00),
  ((SELECT id FROM items_menu WHERE nombre = 'Ensalada de Jitomate'), 'Grande', 460.00);

-- ============================================
-- PLATOS FUERTES
-- ============================================

-- Crear variantes de salsas (se usarán para múltiples items)
-- Primero creamos un item temporal para las salsas
INSERT INTO items_menu (nombre, categoria, unidad_medida, tipo_variante) VALUES
  ('Salsas', 'platos_fuertes', 'simple', 'salsa');

INSERT INTO variantes_menu (item_menu_id, nombre) VALUES
  ((SELECT id FROM items_menu WHERE nombre = 'Salsas'), 'A la Naranja'),
  ((SELECT id FROM items_menu WHERE nombre = 'Salsas'), 'Adobo'),
  ((SELECT id FROM items_menu WHERE nombre = 'Salsas'), 'BBQ'),
  ((SELECT id FROM items_menu WHERE nombre = 'Salsas'), 'Jamaica');

-- Lomo Mechado ($460 por kg)
INSERT INTO items_menu (nombre, categoria, unidad_medida, precio_base, tipo_variante) VALUES
  ('Lomo Mechado', 'platos_fuertes', 'kg', 460.00, 'salsa');

-- Costillas Horneadas ($490 por kg)
INSERT INTO items_menu (nombre, categoria, unidad_medida, precio_base, tipo_variante) VALUES
  ('Costillas Horneadas', 'platos_fuertes', 'kg', 490.00, 'salsa');

-- Pierna de Pavo ($210 por kg)
INSERT INTO items_menu (nombre, categoria, unidad_medida, precio_base, tipo_variante) VALUES
  ('Pierna de Pavo', 'platos_fuertes', 'kg', 210.00, 'salsa');

-- Pavo Completo ($260 por kg)
INSERT INTO items_menu (nombre, categoria, unidad_medida, precio_base, tipo_variante) VALUES
  ('Pavo Completo Horneado', 'platos_fuertes', 'kg', 260.00, 'salsa');

-- Relleno de Pavo ($260 por kg)
INSERT INTO items_menu (nombre, categoria, unidad_medida, precio_base) VALUES
  ('Relleno de Pavo', 'platos_fuertes', 'kg', 260.00);

-- Lasañas por tamaño
INSERT INTO items_menu (nombre, categoria, unidad_medida, tipo_variante) VALUES
  ('Lasaña Boloñesa', 'platos_fuertes', 'tamaño', 'tamaño'),
  ('Lasaña Vegetales', 'platos_fuertes', 'tamaño', 'tamaño');

INSERT INTO variantes_menu (item_menu_id, nombre, precio) VALUES
  ((SELECT id FROM items_menu WHERE nombre = 'Lasaña Boloñesa'), 'Chica', 300.00),
  ((SELECT id FROM items_menu WHERE nombre = 'Lasaña Boloñesa'), 'Mediana', 680.00),
  ((SELECT id FROM items_menu WHERE nombre = 'Lasaña Boloñesa'), 'Grande', 1000.00),
  ((SELECT id FROM items_menu WHERE nombre = 'Lasaña Boloñesa'), 'Jumbo', 1300.00),
  ((SELECT id FROM items_menu WHERE nombre = 'Lasaña Vegetales'), 'Chica', 300.00),
  ((SELECT id FROM items_menu WHERE nombre = 'Lasaña Vegetales'), 'Mediana', 680.00),
  ((SELECT id FROM items_menu WHERE nombre = 'Lasaña Vegetales'), 'Grande', 1000.00),
  ((SELECT id FROM items_menu WHERE nombre = 'Lasaña Vegetales'), 'Jumbo', 1300.00);

-- Rollos de Pollo ($120 por pieza) con rellenos
INSERT INTO items_menu (nombre, categoria, unidad_medida, precio_base, tipo_variante) VALUES
  ('Rollos de Pollo', 'platos_fuertes', 'pz', 120.00, 'relleno');

INSERT INTO variantes_menu (item_menu_id, nombre) VALUES
  ((SELECT id FROM items_menu WHERE nombre = 'Rollos de Pollo'), 'Clásico'),
  ((SELECT id FROM items_menu WHERE nombre = 'Rollos de Pollo'), 'Navideño'),
  ((SELECT id FROM items_menu WHERE nombre = 'Rollos de Pollo'), 'Campestre');

-- ============================================
-- POSTRES Y BEBIDAS
-- ============================================

-- Postres
INSERT INTO items_menu (nombre, categoria, unidad_medida, precio_base) VALUES
  ('Tarta de Frutas', 'postres_bebidas', 'pz', 50.00),
  ('Cheesecake Grande', 'postres_bebidas', 'pz', 550.00),
  ('Ensalada de Manzana', 'postres_bebidas', 'kg', 280.00),
  ('Peras al Vino Tinto', 'postres_bebidas', 'pz', 65.00),
  ('Pastel Costco', 'postres_bebidas', 'pz', 550.00),
  ('Pan de Ajo', 'postres_bebidas', 'pz', 10.00);

-- Bebidas por litro
INSERT INTO items_menu (nombre, categoria, unidad_medida, precio_base) VALUES
  ('Clericot Lambrusco', 'postres_bebidas', 'litro', 280.00),
  ('Vino Rosado', 'postres_bebidas', 'litro', 280.00),
  ('Vino Blanco', 'postres_bebidas', 'litro', 280.00),
  ('Mezcalitas', 'postres_bebidas', 'litro', 240.00);

-- ============================================
-- Políticas de Seguridad (RLS)
-- ============================================

ALTER TABLE items_menu ENABLE ROW LEVEL SECURITY;
ALTER TABLE variantes_menu ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE items_pedido ENABLE ROW LEVEL SECURITY;

-- Políticas para items_menu
CREATE POLICY "Permitir lectura pública de items_menu" ON items_menu FOR SELECT USING (true);
CREATE POLICY "Permitir inserción pública de items_menu" ON items_menu FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir actualización pública de items_menu" ON items_menu FOR UPDATE USING (true);
CREATE POLICY "Permitir eliminación pública de items_menu" ON items_menu FOR DELETE USING (true);

-- Políticas para variantes_menu
CREATE POLICY "Permitir lectura pública de variantes_menu" ON variantes_menu FOR SELECT USING (true);
CREATE POLICY "Permitir inserción pública de variantes_menu" ON variantes_menu FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir actualización pública de variantes_menu" ON variantes_menu FOR UPDATE USING (true);
CREATE POLICY "Permitir eliminación pública de variantes_menu" ON variantes_menu FOR DELETE USING (true);

-- Políticas para pedidos
CREATE POLICY "Permitir lectura pública de pedidos" ON pedidos FOR SELECT USING (true);
CREATE POLICY "Permitir inserción pública de pedidos" ON pedidos FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir actualización pública de pedidos" ON pedidos FOR UPDATE USING (true);
CREATE POLICY "Permitir eliminación pública de pedidos" ON pedidos FOR DELETE USING (true);

-- Políticas para items_pedido
CREATE POLICY "Permitir lectura pública de items_pedido" ON items_pedido FOR SELECT USING (true);
CREATE POLICY "Permitir inserción pública de items_pedido" ON items_pedido FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir actualización pública de items_pedido" ON items_pedido FOR UPDATE USING (true);
CREATE POLICY "Permitir eliminación pública de items_pedido" ON items_pedido FOR DELETE USING (true);

-- ============================================
-- ARREGLAR PROBLEMA DE CLAVES FORÁNEAS DUPLICADAS
-- ============================================

-- IMPORTANTE: Supabase a veces genera nombres automáticos de constraints que causan ambigüedad.
-- Este bloque asegura que las claves foráneas tengan nombres explícitos para que el cliente JS no se confunda.
-- (Ya lo manejamos en el código JS usando !fkey, pero es buena práctica tener ordenado esto)

-- 1. Habilitar REALTIME para la tabla pedidos
-- Esto permite que el cliente reciba notificaciones push cuando hay cambios
ALTER PUBLICATION supabase_realtime ADD TABLE pedidos;
ALTER PUBLICATION supabase_realtime ADD TABLE items_pedido;

-- ============================================
-- FASE 3: GESTIÓN DE COCINA (Actualización)
-- ============================================

-- Agregar estado a los items individuales
ALTER TABLE items_pedido 
ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'preparando', 'listo'));

-- Agregar tiempo de preparación al menú (en minutos)
ALTER TABLE items_menu 
ADD COLUMN IF NOT EXISTS tiempo_preparacion INTEGER DEFAULT 0;

-- Actualizar tiempos estimados por CATEGORÍA (Regla Simplificada)
-- Platos Fuertes = 3 horas (180 min)
-- Entradas = 2 horas (120 min)
-- Postres/Bebidas = 1 hora (60 min)
-- Función y Trigger para sincronización automática
-- Si todos los items están LISTOS -> Pedido COMPLETADO
-- Si hay items EN PROCESO o LISTOS (pero no todos) -> Pedido EN PREPARACIÓN
-- Si todos están PENDIENTES -> Pedido PENDIENTE

CREATE OR REPLACE FUNCTION actualizar_estado_pedido()
RETURNS TRIGGER AS $$
DECLARE
    total_items INTEGER;
    items_listos INTEGER;
    items_preparando INTEGER;
BEGIN
    -- Contar items del pedido
    SELECT count(*),
           count(*) FILTER (WHERE estado = 'listo'),
           count(*) FILTER (WHERE estado = 'preparando')
    INTO total_items, items_listos, items_preparando
    FROM items_pedido
    WHERE pedido_id = NEW.pedido_id;

    -- Determinar nuevo estado
    IF items_listos = total_items AND total_items > 0 THEN
        UPDATE pedidos SET estado = 'completado' WHERE id = NEW.pedido_id;
    ELSIF items_preparando > 0 OR items_listos > 0 THEN
        UPDATE pedidos SET estado = 'en_preparacion' WHERE id = NEW.pedido_id;
    ELSE
        UPDATE pedidos SET estado = 'pendiente' WHERE id = NEW.pedido_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Dropear trigger si existe para evitar duplicados en re-runs
DROP TRIGGER IF EXISTS trigger_actualizar_estado_pedido ON items_pedido;

CREATE TRIGGER trigger_actualizar_estado_pedido
AFTER UPDATE OF estado ON items_pedido
FOR EACH ROW
EXECUTE FUNCTION actualizar_estado_pedido();
