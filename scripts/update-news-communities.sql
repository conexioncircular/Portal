/*
  Fase 2 - Creacion o adaptacion idempotente de [cms].[NewsCommunities].

  [cms].[NewsCommunities] sera la fuente de pertenencia multicomunidad para
  el codigo futuro. [cms].[News].[CommunityId] se conserva como comunidad
  principal y como compatibilidad temporal con el codigo antiguo.

  Las imagenes permanecen asociadas una sola vez a [cms].[NewsImages] por
  [NewsId]. Este script no modifica imagenes ni realiza operaciones en Azure.

  "Todas las comunidades" se implementara como la seleccion explicita de las
  comunidades existentes y seleccionables al guardar. No existe todavia una
  regla que asocie automaticamente comunidades creadas en el futuro.
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @BackfilledRows INT = 0;
DECLARE @NewsObjectId INT;
DECLARE @CommunitiesObjectId INT;
DECLARE @NewsCommunitiesObjectId INT;

IF SCHEMA_ID(N'cms') IS NULL
  THROW 50201, 'No existe el esquema [cms]. No se realizaron cambios.', 1;

SET @NewsObjectId = OBJECT_ID(N'[cms].[News]', N'U');
IF @NewsObjectId IS NULL
  THROW 50202, 'No existe la tabla [cms].[News]. No se realizaron cambios.', 1;

SET @CommunitiesObjectId = OBJECT_ID(N'[cms].[Communities]', N'U');
IF @CommunitiesObjectId IS NULL
  THROW 50203, 'No existe la tabla [cms].[Communities]. No se realizaron cambios.', 1;

IF NOT EXISTS (
  SELECT 1
  FROM sys.columns
  WHERE object_id = @NewsObjectId
    AND name = N'NewsId'
    AND TYPE_NAME(system_type_id) = N'uniqueidentifier'
    AND is_nullable = 0
)
  THROW 50204, '[cms].[News].[NewsId] no existe o no es UNIQUEIDENTIFIER NOT NULL.', 1;

IF NOT EXISTS (
  SELECT 1
  FROM sys.columns
  WHERE object_id = @NewsObjectId
    AND name = N'CommunityId'
    AND TYPE_NAME(system_type_id) = N'uniqueidentifier'
)
  THROW 50205, '[cms].[News].[CommunityId] no existe o no es compatible con UNIQUEIDENTIFIER.', 1;

IF NOT EXISTS (
  SELECT 1
  FROM sys.columns
  WHERE object_id = @CommunitiesObjectId
    AND name = N'CommunityId'
    AND TYPE_NAME(system_type_id) = N'uniqueidentifier'
    AND is_nullable = 0
)
  THROW 50206, '[cms].[Communities].[CommunityId] no existe o no es UNIQUEIDENTIFIER NOT NULL.', 1;

IF NOT EXISTS (
  SELECT 1
  FROM sys.columns
  WHERE object_id = @NewsObjectId
    AND name = N'Slug'
    AND TYPE_NAME(system_type_id) IN (N'nvarchar', N'nchar', N'varchar', N'char')
)
  THROW 50207, '[cms].[News].[Slug] no existe o no es una cadena compatible para los diagnosticos.', 1;

IF NOT EXISTS (
  SELECT 1
  FROM sys.indexes AS i
  WHERE i.object_id = @NewsObjectId
    AND i.is_unique = 1
    AND i.is_disabled = 0
    AND 1 = (
      SELECT COUNT(*)
      FROM sys.index_columns AS ic
      WHERE ic.object_id = i.object_id
        AND ic.index_id = i.index_id
        AND ic.key_ordinal > 0
    )
    AND EXISTS (
      SELECT 1
      FROM sys.index_columns AS ic
      INNER JOIN sys.columns AS c
        ON c.object_id = ic.object_id
       AND c.column_id = ic.column_id
      WHERE ic.object_id = i.object_id
        AND ic.index_id = i.index_id
        AND ic.key_ordinal = 1
        AND c.name = N'NewsId'
    )
)
  THROW 50208, '[cms].[News].[NewsId] no tiene una clave unica compatible para la FK.', 1;

IF NOT EXISTS (
  SELECT 1
  FROM sys.indexes AS i
  WHERE i.object_id = @CommunitiesObjectId
    AND i.is_unique = 1
    AND i.is_disabled = 0
    AND 1 = (
      SELECT COUNT(*)
      FROM sys.index_columns AS ic
      WHERE ic.object_id = i.object_id
        AND ic.index_id = i.index_id
        AND ic.key_ordinal > 0
    )
    AND EXISTS (
      SELECT 1
      FROM sys.index_columns AS ic
      INNER JOIN sys.columns AS c
        ON c.object_id = ic.object_id
       AND c.column_id = ic.column_id
      WHERE ic.object_id = i.object_id
        AND ic.index_id = i.index_id
        AND ic.key_ordinal = 1
        AND c.name = N'CommunityId'
    )
)
  THROW 50209, '[cms].[Communities].[CommunityId] no tiene una clave unica compatible para la FK.', 1;

BEGIN TRY
  BEGIN TRANSACTION;

  /*
    SQL Server compila el batch completo antes de ejecutar sus sentencias.
    Como la tabla y algunas de sus columnas pueden crearse condicionalmente,
    toda referencia DDL o DML a [cms].[NewsCommunities] se compila en un
    alcance posterior mediante sys.sp_executesql. Esto evita errores de
    compilacion anticipada cuando el objeto no existia al iniciar el batch.
  */
  SET @NewsCommunitiesObjectId = OBJECT_ID(N'[cms].[NewsCommunities]', N'U');

  IF @NewsCommunitiesObjectId IS NULL
  BEGIN
    EXEC sys.sp_executesql N'
      CREATE TABLE [cms].[NewsCommunities] (
        [NewsId] UNIQUEIDENTIFIER NOT NULL,
        [CommunityId] UNIQUEIDENTIFIER NOT NULL,
        [CreatedAt] DATETIME2(7) NOT NULL
      );';

    SET @NewsCommunitiesObjectId = OBJECT_ID(N'[cms].[NewsCommunities]', N'U');
  END;

  IF @NewsCommunitiesObjectId IS NULL
    THROW 50210, 'No fue posible crear o localizar [cms].[NewsCommunities].', 1;

  IF COL_LENGTH(N'cms.NewsCommunities', N'NewsId') IS NULL
  BEGIN
    IF EXISTS (
      SELECT 1
      FROM sys.partitions
      WHERE object_id = @NewsCommunitiesObjectId
        AND index_id IN (0, 1)
        AND rows > 0
    )
      THROW 50211, 'NewsCommunities contiene filas y no tiene NewsId; no puede adaptarse con seguridad.', 1;

    EXEC sys.sp_executesql N'
      ALTER TABLE [cms].[NewsCommunities]
        ADD [NewsId] UNIQUEIDENTIFIER NOT NULL;';
  END;

  IF COL_LENGTH(N'cms.NewsCommunities', N'CommunityId') IS NULL
  BEGIN
    IF EXISTS (
      SELECT 1
      FROM sys.partitions
      WHERE object_id = @NewsCommunitiesObjectId
        AND index_id IN (0, 1)
        AND rows > 0
    )
      THROW 50212, 'NewsCommunities contiene filas y no tiene CommunityId; no puede adaptarse con seguridad.', 1;

    EXEC sys.sp_executesql N'
      ALTER TABLE [cms].[NewsCommunities]
        ADD [CommunityId] UNIQUEIDENTIFIER NOT NULL;';
  END;

  IF COL_LENGTH(N'cms.NewsCommunities', N'CreatedAt') IS NULL
  BEGIN
    IF OBJECT_ID(N'[cms].[DF_NewsCommunities_CreatedAt]', N'D') IS NOT NULL
      THROW 50213, 'DF_NewsCommunities_CreatedAt ya existe y no pertenece a la columna esperada.', 1;

    EXEC sys.sp_executesql N'
      ALTER TABLE [cms].[NewsCommunities]
        ADD [CreatedAt] DATETIME2(7) NOT NULL
          CONSTRAINT [DF_NewsCommunities_CreatedAt]
          DEFAULT SYSUTCDATETIME() WITH VALUES;';
  END;

  SET @NewsCommunitiesObjectId = OBJECT_ID(N'[cms].[NewsCommunities]', N'U');

  IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = @NewsCommunitiesObjectId
      AND name = N'NewsId'
      AND TYPE_NAME(system_type_id) = N'uniqueidentifier'
  )
    THROW 50214, '[cms].[NewsCommunities].[NewsId] no es UNIQUEIDENTIFIER.', 1;

  IF EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = @NewsCommunitiesObjectId
      AND name = N'NewsId'
      AND is_nullable = 1
  )
  BEGIN
    EXEC sys.sp_executesql N'
      IF EXISTS (SELECT 1 FROM [cms].[NewsCommunities] WHERE [NewsId] IS NULL)
        THROW 50215, ''NewsCommunities contiene NewsId NULL; no se puede imponer NOT NULL.'', 1;

      ALTER TABLE [cms].[NewsCommunities]
        ALTER COLUMN [NewsId] UNIQUEIDENTIFIER NOT NULL;';
  END;

  IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = @NewsCommunitiesObjectId
      AND name = N'CommunityId'
      AND TYPE_NAME(system_type_id) = N'uniqueidentifier'
  )
    THROW 50216, '[cms].[NewsCommunities].[CommunityId] no es UNIQUEIDENTIFIER.', 1;

  IF EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = @NewsCommunitiesObjectId
      AND name = N'CommunityId'
      AND is_nullable = 1
  )
  BEGIN
    EXEC sys.sp_executesql N'
      IF EXISTS (SELECT 1 FROM [cms].[NewsCommunities] WHERE [CommunityId] IS NULL)
        THROW 50217, ''NewsCommunities contiene CommunityId NULL; no se puede imponer NOT NULL.'', 1;

      ALTER TABLE [cms].[NewsCommunities]
        ALTER COLUMN [CommunityId] UNIQUEIDENTIFIER NOT NULL;';
  END;

  IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = @NewsCommunitiesObjectId
      AND name = N'CreatedAt'
      AND TYPE_NAME(system_type_id) = N'datetime2'
      AND scale = 7
  )
    THROW 50218, '[cms].[NewsCommunities].[CreatedAt] no es DATETIME2(7).', 1;

  IF EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = @NewsCommunitiesObjectId
      AND name = N'CreatedAt'
      AND is_nullable = 1
  )
  BEGIN
    EXEC sys.sp_executesql N'
      UPDATE [cms].[NewsCommunities]
      SET [CreatedAt] = SYSUTCDATETIME()
      WHERE [CreatedAt] IS NULL;

      ALTER TABLE [cms].[NewsCommunities]
        ALTER COLUMN [CreatedAt] DATETIME2(7) NOT NULL;';
  END;

  IF EXISTS (
    SELECT 1
    FROM sys.default_constraints AS dc
    INNER JOIN sys.columns AS c
      ON c.object_id = dc.parent_object_id
     AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = @NewsCommunitiesObjectId
      AND c.name = N'CreatedAt'
      AND LOWER(REPLACE(REPLACE(REPLACE(dc.definition, N'(', N''), N')', N''), N' ', N''))
          NOT LIKE N'%sysutcdatetime%'
  )
    THROW 50219, 'CreatedAt tiene un DEFAULT incompatible; se esperaba SYSUTCDATETIME().', 1;

  IF NOT EXISTS (
    SELECT 1
    FROM sys.default_constraints AS dc
    INNER JOIN sys.columns AS c
      ON c.object_id = dc.parent_object_id
     AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = @NewsCommunitiesObjectId
      AND c.name = N'CreatedAt'
  )
  BEGIN
    IF OBJECT_ID(N'[cms].[DF_NewsCommunities_CreatedAt]', N'D') IS NOT NULL
      THROW 50220, 'DF_NewsCommunities_CreatedAt ya existe con una definicion diferente.', 1;

    EXEC sys.sp_executesql N'
      ALTER TABLE [cms].[NewsCommunities]
        ADD CONSTRAINT [DF_NewsCommunities_CreatedAt]
        DEFAULT SYSUTCDATETIME() FOR [CreatedAt];';
  END;

  IF EXISTS (
    SELECT 1
    FROM sys.key_constraints
    WHERE parent_object_id = @NewsCommunitiesObjectId
      AND type = N'PK'
  ) AND NOT EXISTS (
    SELECT 1
    FROM sys.key_constraints AS kc
    WHERE kc.parent_object_id = @NewsCommunitiesObjectId
      AND kc.type = N'PK'
      AND 2 = (
        SELECT COUNT(*)
        FROM sys.index_columns AS ic
        WHERE ic.object_id = kc.parent_object_id
          AND ic.index_id = kc.unique_index_id
          AND ic.key_ordinal > 0
      )
      AND EXISTS (
        SELECT 1
        FROM sys.index_columns AS ic
        INNER JOIN sys.columns AS c
          ON c.object_id = ic.object_id
         AND c.column_id = ic.column_id
        WHERE ic.object_id = kc.parent_object_id
          AND ic.index_id = kc.unique_index_id
          AND ic.key_ordinal = 1
          AND c.name = N'NewsId'
      )
      AND EXISTS (
        SELECT 1
        FROM sys.index_columns AS ic
        INNER JOIN sys.columns AS c
          ON c.object_id = ic.object_id
         AND c.column_id = ic.column_id
        WHERE ic.object_id = kc.parent_object_id
          AND ic.index_id = kc.unique_index_id
          AND ic.key_ordinal = 2
          AND c.name = N'CommunityId'
      )
  )
    THROW 50221, 'NewsCommunities ya tiene una PK incompatible.', 1;

  IF NOT EXISTS (
    SELECT 1
    FROM sys.key_constraints AS kc
    WHERE kc.parent_object_id = @NewsCommunitiesObjectId
      AND kc.type = N'PK'
      AND 2 = (
        SELECT COUNT(*)
        FROM sys.index_columns AS ic
        WHERE ic.object_id = kc.parent_object_id
          AND ic.index_id = kc.unique_index_id
          AND ic.key_ordinal > 0
      )
      AND EXISTS (
        SELECT 1
        FROM sys.index_columns AS ic
        INNER JOIN sys.columns AS c
          ON c.object_id = ic.object_id
         AND c.column_id = ic.column_id
        WHERE ic.object_id = kc.parent_object_id
          AND ic.index_id = kc.unique_index_id
          AND ic.key_ordinal = 1
          AND c.name = N'NewsId'
      )
      AND EXISTS (
        SELECT 1
        FROM sys.index_columns AS ic
        INNER JOIN sys.columns AS c
          ON c.object_id = ic.object_id
         AND c.column_id = ic.column_id
        WHERE ic.object_id = kc.parent_object_id
          AND ic.index_id = kc.unique_index_id
          AND ic.key_ordinal = 2
          AND c.name = N'CommunityId'
      )
  )
  BEGIN
    IF OBJECT_ID(N'[cms].[PK_NewsCommunities]', N'PK') IS NOT NULL
      THROW 50222, 'PK_NewsCommunities ya existe con una definicion diferente.', 1;

    IF EXISTS (
      SELECT 1
      FROM sys.indexes
      WHERE object_id = @NewsCommunitiesObjectId
        AND type = 1
        AND is_hypothetical = 0
    )
      THROW 50223, 'NewsCommunities ya tiene un indice clustered; no se puede crear la PK clustered esperada.', 1;

    EXEC sys.sp_executesql N'
      IF EXISTS (
        SELECT 1
        FROM [cms].[NewsCommunities]
        GROUP BY [NewsId], [CommunityId]
        HAVING COUNT_BIG(*) > 1
      )
        THROW 50224, ''NewsCommunities contiene asociaciones duplicadas; no se creo la PK.'', 1;

      ALTER TABLE [cms].[NewsCommunities]
        ADD CONSTRAINT [PK_NewsCommunities]
        PRIMARY KEY CLUSTERED ([NewsId], [CommunityId]);';
  END;

  EXEC sys.sp_executesql N'
    IF EXISTS (
      SELECT 1
      FROM [cms].[NewsCommunities] AS nc
      LEFT JOIN [cms].[News] AS n
        ON n.[NewsId] = nc.[NewsId]
      WHERE n.[NewsId] IS NULL
    )
      THROW 50225, ''NewsCommunities contiene NewsId huerfanos; no se puede crear la FK.'', 1;

    IF EXISTS (
      SELECT 1
      FROM [cms].[NewsCommunities] AS nc
      LEFT JOIN [cms].[Communities] AS c
        ON c.[CommunityId] = nc.[CommunityId]
      WHERE c.[CommunityId] IS NULL
    )
      THROW 50226, ''NewsCommunities contiene CommunityId huerfanos; no se puede crear la FK.'', 1;

    IF EXISTS (
      SELECT 1
      FROM [cms].[News] AS n
      LEFT JOIN [cms].[Communities] AS c
        ON c.[CommunityId] = n.[CommunityId]
      WHERE n.[CommunityId] IS NOT NULL
        AND c.[CommunityId] IS NULL
    )
    BEGIN
      SELECT n.[NewsId], n.[CommunityId]
      FROM [cms].[News] AS n
      LEFT JOIN [cms].[Communities] AS c
        ON c.[CommunityId] = n.[CommunityId]
      WHERE n.[CommunityId] IS NOT NULL
        AND c.[CommunityId] IS NULL
      ORDER BY n.[NewsId];

      THROW 50227, ''Existen noticias con CommunityId inexistente. Se aborto antes del backfill.'', 1;
    END;';

  IF NOT EXISTS (
    SELECT 1
    FROM sys.foreign_keys AS fk
    INNER JOIN sys.foreign_key_columns AS fkc
      ON fkc.constraint_object_id = fk.object_id
    INNER JOIN sys.columns AS parentColumn
      ON parentColumn.object_id = fkc.parent_object_id
     AND parentColumn.column_id = fkc.parent_column_id
    INNER JOIN sys.columns AS referencedColumn
      ON referencedColumn.object_id = fkc.referenced_object_id
     AND referencedColumn.column_id = fkc.referenced_column_id
    WHERE fk.parent_object_id = @NewsCommunitiesObjectId
      AND fk.referenced_object_id = @NewsObjectId
      AND parentColumn.name = N'NewsId'
      AND referencedColumn.name = N'NewsId'
      AND fk.delete_referential_action = 0
      AND fk.update_referential_action = 0
      AND 1 = (
        SELECT COUNT(*)
        FROM sys.foreign_key_columns AS fkColumn
        WHERE fkColumn.constraint_object_id = fk.object_id
      )
  )
  BEGIN
    IF OBJECT_ID(N'[cms].[FK_NewsCommunities_News]', N'F') IS NOT NULL
      THROW 50228, 'FK_NewsCommunities_News ya existe con una definicion diferente.', 1;

    EXEC sys.sp_executesql N'
      ALTER TABLE [cms].[NewsCommunities] WITH CHECK
        ADD CONSTRAINT [FK_NewsCommunities_News]
        FOREIGN KEY ([NewsId]) REFERENCES [cms].[News] ([NewsId]);

      ALTER TABLE [cms].[NewsCommunities]
        CHECK CONSTRAINT [FK_NewsCommunities_News];';
  END;

  IF NOT EXISTS (
    SELECT 1
    FROM sys.foreign_keys AS fk
    INNER JOIN sys.foreign_key_columns AS fkc
      ON fkc.constraint_object_id = fk.object_id
    INNER JOIN sys.columns AS parentColumn
      ON parentColumn.object_id = fkc.parent_object_id
     AND parentColumn.column_id = fkc.parent_column_id
    INNER JOIN sys.columns AS referencedColumn
      ON referencedColumn.object_id = fkc.referenced_object_id
     AND referencedColumn.column_id = fkc.referenced_column_id
    WHERE fk.parent_object_id = @NewsCommunitiesObjectId
      AND fk.referenced_object_id = @CommunitiesObjectId
      AND parentColumn.name = N'CommunityId'
      AND referencedColumn.name = N'CommunityId'
      AND fk.delete_referential_action = 0
      AND fk.update_referential_action = 0
      AND 1 = (
        SELECT COUNT(*)
        FROM sys.foreign_key_columns AS fkColumn
        WHERE fkColumn.constraint_object_id = fk.object_id
      )
  )
  BEGIN
    IF OBJECT_ID(N'[cms].[FK_NewsCommunities_Communities]', N'F') IS NOT NULL
      THROW 50229, 'FK_NewsCommunities_Communities ya existe con una definicion diferente.', 1;

    EXEC sys.sp_executesql N'
      ALTER TABLE [cms].[NewsCommunities] WITH CHECK
        ADD CONSTRAINT [FK_NewsCommunities_Communities]
        FOREIGN KEY ([CommunityId]) REFERENCES [cms].[Communities] ([CommunityId]);

      ALTER TABLE [cms].[NewsCommunities]
        CHECK CONSTRAINT [FK_NewsCommunities_Communities];';
  END;

  IF EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE parent_object_id = @NewsCommunitiesObjectId
      AND (
        delete_referential_action <> 0
        OR update_referential_action <> 0
        OR is_disabled = 1
        OR is_not_trusted = 1
      )
  )
    THROW 50230, 'NewsCommunities contiene una FK con CASCADE, deshabilitada o no confiable.', 1;

  IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes AS i
    WHERE i.object_id = @NewsCommunitiesObjectId
      AND i.is_unique = 0
      AND i.is_disabled = 0
      AND i.is_hypothetical = 0
      AND i.has_filter = 0
      AND 2 = (
        SELECT COUNT(*)
        FROM sys.index_columns AS ic
        WHERE ic.object_id = i.object_id
          AND ic.index_id = i.index_id
          AND ic.key_ordinal > 0
      )
      AND EXISTS (
        SELECT 1
        FROM sys.index_columns AS ic
        INNER JOIN sys.columns AS c
          ON c.object_id = ic.object_id
         AND c.column_id = ic.column_id
        WHERE ic.object_id = i.object_id
          AND ic.index_id = i.index_id
          AND ic.key_ordinal = 1
          AND c.name = N'CommunityId'
      )
      AND EXISTS (
        SELECT 1
        FROM sys.index_columns AS ic
        INNER JOIN sys.columns AS c
          ON c.object_id = ic.object_id
         AND c.column_id = ic.column_id
        WHERE ic.object_id = i.object_id
          AND ic.index_id = i.index_id
          AND ic.key_ordinal = 2
          AND c.name = N'NewsId'
      )
  )
  BEGIN
    IF EXISTS (
      SELECT 1
      FROM sys.indexes
      WHERE object_id = @NewsCommunitiesObjectId
        AND name = N'IX_NewsCommunities_CommunityId_NewsId'
    )
      THROW 50231, 'IX_NewsCommunities_CommunityId_NewsId existe con una definicion diferente.', 1;

    EXEC sys.sp_executesql N'
      CREATE INDEX [IX_NewsCommunities_CommunityId_NewsId]
        ON [cms].[NewsCommunities] ([CommunityId], [NewsId]);';
  END;

  EXEC sys.sp_executesql N'
    INSERT INTO [cms].[NewsCommunities] (
      [NewsId],
      [CommunityId],
      [CreatedAt]
    )
    SELECT
      n.[NewsId],
      n.[CommunityId],
      SYSUTCDATETIME()
    FROM [cms].[News] AS n
    INNER JOIN [cms].[Communities] AS c
      ON c.[CommunityId] = n.[CommunityId]
    WHERE n.[CommunityId] IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM [cms].[NewsCommunities] AS existingAssociation
        WHERE existingAssociation.[NewsId] = n.[NewsId]
          AND existingAssociation.[CommunityId] = n.[CommunityId]
      );

    SET @InsertedRows = @@ROWCOUNT;',
    N'@InsertedRows INT OUTPUT',
    @InsertedRows = @BackfilledRows OUTPUT;

  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF XACT_STATE() <> 0
    ROLLBACK TRANSACTION;

  THROW;
END CATCH;

/*
  Diagnosticos no destructivos posteriores al COMMIT.
  La concurrencia de slugs por comunidad se resolvera en el backend
  transaccional de una fase posterior; aqui solo se informa su estado.
*/
EXEC sys.sp_executesql N'
  SELECT N''Cantidad total de noticias'' AS [Metric], COUNT_BIG(*) AS [Value]
  FROM [cms].[News];

  SELECT N''Cantidad total de asociaciones'' AS [Metric], COUNT_BIG(*) AS [Value]
  FROM [cms].[NewsCommunities];

  SELECT N''Registros insertados por esta ejecucion'' AS [Metric],
         CONVERT(BIGINT, @InsertedRows) AS [Value];

  SELECT n.[NewsId], n.[CommunityId]
  FROM [cms].[News] AS n
  WHERE n.[CommunityId] IS NULL
  ORDER BY n.[NewsId];

  SELECT n.[NewsId], n.[CommunityId]
  FROM [cms].[News] AS n
  LEFT JOIN [cms].[Communities] AS c
    ON c.[CommunityId] = n.[CommunityId]
  WHERE n.[CommunityId] IS NOT NULL
    AND c.[CommunityId] IS NULL
  ORDER BY n.[NewsId];

  SELECT n.[NewsId], n.[CommunityId] AS [LegacyCommunityId]
  FROM [cms].[News] AS n
  WHERE NOT EXISTS (
    SELECT 1
    FROM [cms].[NewsCommunities] AS nc
    WHERE nc.[NewsId] = n.[NewsId]
  )
  ORDER BY n.[NewsId];

  SELECT nc.[NewsId], nc.[CommunityId], COUNT_BIG(*) AS [DuplicateCount]
  FROM [cms].[NewsCommunities] AS nc
  GROUP BY nc.[NewsId], nc.[CommunityId]
  HAVING COUNT_BIG(*) > 1;

  SELECT nc.[NewsId], nc.[CommunityId]
  FROM [cms].[NewsCommunities] AS nc
  LEFT JOIN [cms].[News] AS n
    ON n.[NewsId] = nc.[NewsId]
  WHERE n.[NewsId] IS NULL
  ORDER BY nc.[NewsId], nc.[CommunityId];

  SELECT nc.[NewsId], nc.[CommunityId]
  FROM [cms].[NewsCommunities] AS nc
  LEFT JOIN [cms].[Communities] AS c
    ON c.[CommunityId] = nc.[CommunityId]
  WHERE c.[CommunityId] IS NULL
  ORDER BY nc.[CommunityId], nc.[NewsId];

  SELECT n.[NewsId], n.[CommunityId] AS [LegacyCommunityId]
  FROM [cms].[News] AS n
  WHERE n.[CommunityId] IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM [cms].[NewsCommunities] AS nc
      WHERE nc.[NewsId] = n.[NewsId]
        AND nc.[CommunityId] = n.[CommunityId]
    )
  ORDER BY n.[NewsId];

  SELECT nc.[NewsId], COUNT_BIG(*) AS [CommunityCount]
  FROM [cms].[NewsCommunities] AS nc
  GROUP BY nc.[NewsId]
  HAVING COUNT_BIG(*) > 1
  ORDER BY nc.[NewsId];

  SELECT
    c.[CommunityId],
    c.[Name] AS [CommunityName],
    COUNT_BIG(nc.[NewsId]) AS [NewsCount]
  FROM [cms].[Communities] AS c
  LEFT JOIN [cms].[NewsCommunities] AS nc
    ON nc.[CommunityId] = c.[CommunityId]
  GROUP BY c.[CommunityId], c.[Name]
  ORDER BY c.[Name], c.[CommunityId];

  SELECT
    nc.[CommunityId],
    LOWER(CONVERT(NVARCHAR(4000), n.[Slug])) AS [NormalizedSlug],
    COUNT_BIG(DISTINCT n.[NewsId]) AS [NewsCount]
  FROM [cms].[NewsCommunities] AS nc
  INNER JOIN [cms].[News] AS n
    ON n.[NewsId] = nc.[NewsId]
  GROUP BY nc.[CommunityId], LOWER(CONVERT(NVARCHAR(4000), n.[Slug]))
  HAVING COUNT_BIG(DISTINCT n.[NewsId]) > 1
  ORDER BY nc.[CommunityId], [NormalizedSlug];

  SELECT
    n.[NewsId],
    n.[CommunityId] AS [LegacyCommunityId],
    SUM(
      CASE WHEN nc.[CommunityId] = n.[CommunityId] THEN CONVERT(BIGINT, 1)
           ELSE CONVERT(BIGINT, 0)
      END
    ) AS [PrimaryAssociationCount]
  FROM [cms].[News] AS n
  INNER JOIN [cms].[Communities] AS c
    ON c.[CommunityId] = n.[CommunityId]
  LEFT JOIN [cms].[NewsCommunities] AS nc
    ON nc.[NewsId] = n.[NewsId]
  WHERE n.[CommunityId] IS NOT NULL
  GROUP BY n.[NewsId], n.[CommunityId]
  HAVING SUM(
    CASE WHEN nc.[CommunityId] = n.[CommunityId] THEN CONVERT(BIGINT, 1)
         ELSE CONVERT(BIGINT, 0)
    END
  ) <> 1
  ORDER BY n.[NewsId];

  SELECT
    N''Noticias legado validas con exactamente su asociacion principal'' AS [Metric],
    COUNT_BIG(*) AS [Value]
  FROM [cms].[News] AS n
  INNER JOIN [cms].[Communities] AS c
    ON c.[CommunityId] = n.[CommunityId]
  WHERE n.[CommunityId] IS NOT NULL
    AND 1 = (
      SELECT COUNT_BIG(*)
      FROM [cms].[NewsCommunities] AS nc
      WHERE nc.[NewsId] = n.[NewsId]
        AND nc.[CommunityId] = n.[CommunityId]
    );',
  N'@InsertedRows INT',
  @InsertedRows = @BackfilledRows;
