# 📦 Migraciones archivadas (LEGACY) — NO EJECUTAR

Esta carpeta contiene migraciones **históricas** que **no forman parte del esquema activo**
y que **no deben ejecutarse**.

## ⛔ Por qué están aquí

| Archivo | Motivo del archivado |
|---|---|
| `0002_miaucv_init.sql` | Contiene `DROP TABLE ... CASCADE` (4 tablas) → destruye datos |
| `0002_miaucv_missing_schema.sql` | Superseded: sus columnas ya están en `0001` (versión `0002_*` duplicada) |
| `0003_miaucv_social.sql` | Contiene `DROP TABLE ... CASCADE` (6 tablas) → destruye datos |
| `0004_miaucv_match.sql` | Contiene `DROP TABLE ... CASCADE` (4 tablas) → destruye datos |

Además, los números de versión estaban **duplicados** (`0002_*` ×2, `0003_*` ×2),
lo que podía provocar ejecuciones parciales o en orden incorrecto.

## ✅ Esquema activo (usar estos)

```
supabase/migrations/0001_miaucv_complete_schema.sql        # esquema base, idempotente y sin DROP TABLE
supabase/migrations/0003_fix_social_relations_and_cache.sql # relaciones, backfill y reload de schema cache
supabase/setup-bucket.sql                                   # bucket cat-photos + políticas storage
```

Orden recomendado de ejecución manual en el **SQL Editor** de Supabase:

1. `0001_miaucv_complete_schema.sql`
2. `0003_fix_social_relations_and_cache.sql`
3. `setup-bucket.sql`

## 🛡️ Protección añadida

Cada archivo archivado empieza con un encabezado de advertencia y un bloque
**BLOQUEO DE EJECUCIÓN** que lanza una excepción si alguien intenta correrlo:

```sql
DO $$
BEGIN
  RAISE EXCEPTION 'ARCHIVED MIGRATION (%). ...';
END $$;
```

Supabase CLI / migraciones automáticas solo leen los `.sql` del **nivel superior**
de `supabase/migrations/`, por lo que estos archivos ya no se ejecutan por accidente.

## ⚠️ Si de verdad necesitas ejecutar una legacy

1. **Backup** en Supabase Dashboard → Database → Backups
2. Prueba primero en un proyecto/entorno de **prueba**
3. Elimina manualmente el bloque `BLOQUEO DE EJECUCIÓN` del archivo (de forma consciente)
4. Ejecútalo **manualmente** en el SQL Editor
5. Verifica los conteos de filas después (los `DROP TABLE` borran todo)

> Este proyecto no incluye `supabase/config.toml`, por lo que no hay migraciones
> automáticas configuradas; el riesgo era la ejecución manual por error.
