/*
  Fase 2 - Adaptacion idempotente de la tabla existente [cms].[NewsImages].

  Estructura base confirmada:
    NewsImageId UNIQUEIDENTIFIER NOT NULL
    NewsId      UNIQUEIDENTIFIER NOT NULL
    ImageUrl    NVARCHAR(500) NOT NULL
    Caption     NVARCHAR(200) NULL
    SortOrder   INT NULL

  Este script no crea ni elimina tablas, no modifica [cms].[News].[ImageUrl]
  y no realiza operaciones sobre Azure Blob Storage.
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @BackfilledRows INT = 0;
DECLARE @NewsObjectId INT;
DECLARE @NewsImagesObjectId INT;
DECLARE @TargetImageUrlMaxLengthBytes INT;

IF SCHEMA_ID(N'cms') IS NULL
  THROW 50001, 'No existe el esquema [cms]. No se realizaron cambios.', 1;

SET @NewsObjectId = OBJECT_ID(N'[cms].[News]', N'U');
IF @NewsObjectId IS NULL
  THROW 50002, 'No existe la tabla [cms].[News]. No se realizaron cambios.', 1;

SET @NewsImagesObjectId = OBJECT_ID(N'[cms].[NewsImages]', N'U');
IF @NewsImagesObjectId IS NULL
  THROW 50003, 'No existe la tabla [cms].[NewsImages]. No se realizaron cambios.', 1;

IF NOT EXISTS (
  SELECT 1
  FROM sys.columns
  WHERE object_id = @NewsObjectId
    AND name = N'NewsId'
    AND TYPE_NAME(system_type_id) = N'uniqueidentifier'
    AND is_nullable = 0
)
  THROW 50004, '[cms].[News].[NewsId] no existe o no es UNIQUEIDENTIFIER NOT NULL.', 1;

IF NOT EXISTS (
  SELECT 1
  FROM sys.columns
  WHERE object_id = @NewsObjectId
    AND name = N'ImageUrl'
    AND TYPE_NAME(system_type_id) IN (N'nvarchar', N'nchar', N'varchar', N'char')
)
  THROW 50005, '[cms].[News].[ImageUrl] no existe o no es una cadena compatible.', 1;

IF NOT EXISTS (
  SELECT 1
  FROM sys.columns
  WHERE object_id = @NewsImagesObjectId
    AND name = N'NewsImageId'
    AND TYPE_NAME(system_type_id) = N'uniqueidentifier'
    AND is_nullable = 0
)
  THROW 50006, '[cms].[NewsImages].[NewsImageId] tiene una definicion incompatible.', 1;

IF NOT EXISTS (
  SELECT 1
  FROM sys.columns
  WHERE object_id = @NewsImagesObjectId
    AND name = N'NewsId'
    AND TYPE_NAME(system_type_id) = N'uniqueidentifier'
    AND is_nullable = 0
)
  THROW 50007, '[cms].[NewsImages].[NewsId] tiene una definicion incompatible.', 1;

SELECT @TargetImageUrlMaxLengthBytes = max_length
FROM sys.columns
WHERE object_id = @NewsImagesObjectId
  AND name = N'ImageUrl'
  AND TYPE_NAME(system_type_id) = N'nvarchar'
  AND is_nullable = 0;

IF @TargetImageUrlMaxLengthBytes IS NULL
  THROW 50008, '[cms].[NewsImages].[ImageUrl] no existe o no es NVARCHAR NOT NULL.', 1;

IF NOT EXISTS (
  SELECT 1
  FROM sys.columns
  WHERE object_id = @NewsImagesObjectId
    AND name = N'Caption'
    AND TYPE_NAME(system_type_id) = N'nvarchar'
    AND max_length = 400
    AND is_nullable = 1
)
  THROW 50009, '[cms].[NewsImages].[Caption] no es NVARCHAR(200) NULL.', 1;

IF NOT EXISTS (
  SELECT 1
  FROM sys.columns
  WHERE object_id = @NewsImagesObjectId
    AND name = N'SortOrder'
    AND TYPE_NAME(system_type_id) = N'int'
)
  THROW 50010, '[cms].[NewsImages].[SortOrder] no existe o no es INT.', 1;

IF NOT EXISTS (
  SELECT 1
  FROM sys.key_constraints AS kc
  INNER JOIN sys.index_columns AS ic
    ON ic.object_id = kc.parent_object_id
   AND ic.index_id = kc.unique_index_id
  INNER JOIN sys.columns AS c
    ON c.object_id = ic.object_id
   AND c.column_id = ic.column_id
  WHERE kc.parent_object_id = @NewsImagesObjectId
    AND kc.name = N'PK_NewsImages'
    AND kc.type = N'PK'
    AND c.name = N'NewsImageId'
    AND ic.key_ordinal = 1
)
  THROW 50011, 'No se encontro PK_NewsImages sobre NewsImageId.', 1;

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
  WHERE fk.name = N'FK_NewsImages_News'
    AND fk.parent_object_id = @NewsImagesObjectId
    AND fk.referenced_object_id = @NewsObjectId
    AND parentColumn.name = N'NewsId'
    AND referencedColumn.name = N'NewsId'
    AND fk.delete_referential_action = 0
    AND fk.update_referential_action = 0
)
  THROW 50012, 'No se encontro FK_NewsImages_News con acciones NO ACTION.', 1;

BEGIN TRY
  BEGIN TRANSACTION;

  /*
    SQL Server compila cada batch antes de ejecutar sus ALTER TABLE. Por eso,
    toda sentencia que agrega o utiliza BlobName, IsCover o CreatedAt se
    compila en un alcance posterior mediante sys.sp_executesql. Esto evita
    Msg. 207 cuando las columnas aun no existian al comenzar este batch.
  */

  IF COL_LENGTH(N'cms.NewsImages', N'BlobName') IS NULL
  BEGIN
    EXEC sys.sp_executesql N'
      ALTER TABLE [cms].[NewsImages]
        ADD [BlobName] NVARCHAR(500) NULL;';
  END;

  IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = @NewsImagesObjectId
      AND name = N'BlobName'
      AND TYPE_NAME(system_type_id) = N'nvarchar'
      AND max_length = 1000
      AND is_nullable = 1
  )
    THROW 50013, '[cms].[NewsImages].[BlobName] no es NVARCHAR(500) NULL.', 1;

  IF COL_LENGTH(N'cms.NewsImages', N'IsCover') IS NULL
  BEGIN
    IF OBJECT_ID(N'[cms].[DF_NewsImages_IsCover]', N'D') IS NOT NULL
      THROW 50014, 'DF_NewsImages_IsCover ya existe pero no esta asociada a IsCover.', 1;

    EXEC sys.sp_executesql N'
      ALTER TABLE [cms].[NewsImages]
        ADD [IsCover] BIT NOT NULL
          CONSTRAINT [DF_NewsImages_IsCover] DEFAULT (0) WITH VALUES;';
  END;

  IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = @NewsImagesObjectId
      AND name = N'IsCover'
      AND TYPE_NAME(system_type_id) = N'bit'
  )
    THROW 50015, '[cms].[NewsImages].[IsCover] no es BIT.', 1;

  IF EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = @NewsImagesObjectId
      AND name = N'IsCover'
      AND is_nullable = 1
  )
  BEGIN
    EXEC sys.sp_executesql N'
      UPDATE [cms].[NewsImages]
      SET [IsCover] = 0
      WHERE [IsCover] IS NULL;

      ALTER TABLE [cms].[NewsImages]
        ALTER COLUMN [IsCover] BIT NOT NULL;';
  END;

  IF NOT EXISTS (
    SELECT 1
    FROM sys.default_constraints AS dc
    INNER JOIN sys.columns AS c
      ON c.object_id = dc.parent_object_id
     AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = @NewsImagesObjectId
      AND c.name = N'IsCover'
  )
  BEGIN
    IF OBJECT_ID(N'[cms].[DF_NewsImages_IsCover]', N'D') IS NOT NULL
      THROW 50016, 'DF_NewsImages_IsCover ya existe pero no esta asociada a IsCover.', 1;

    EXEC sys.sp_executesql N'
      ALTER TABLE [cms].[NewsImages]
        ADD CONSTRAINT [DF_NewsImages_IsCover]
        DEFAULT (0) FOR [IsCover];';
  END;

  IF EXISTS (
    SELECT 1
    FROM sys.default_constraints AS dc
    INNER JOIN sys.columns AS c
      ON c.object_id = dc.parent_object_id
     AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = @NewsImagesObjectId
      AND c.name = N'IsCover'
      AND REPLACE(
            REPLACE(
              REPLACE(LOWER(dc.definition), N'(', N''),
              N')',
              N''
            ),
            N' ',
            N''
          ) <> N'0'
  )
    THROW 50017, 'El DEFAULT existente de IsCover no equivale a 0.', 1;

  IF COL_LENGTH(N'cms.NewsImages', N'CreatedAt') IS NULL
  BEGIN
    IF OBJECT_ID(N'[cms].[DF_NewsImages_CreatedAt]', N'D') IS NOT NULL
      THROW 50018, 'DF_NewsImages_CreatedAt ya existe pero no esta asociada a CreatedAt.', 1;

    EXEC sys.sp_executesql N'
      ALTER TABLE [cms].[NewsImages]
        ADD [CreatedAt] DATETIME2(7) NOT NULL
          CONSTRAINT [DF_NewsImages_CreatedAt]
          DEFAULT (SYSUTCDATETIME()) WITH VALUES;';
  END;

  IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = @NewsImagesObjectId
      AND name = N'CreatedAt'
      AND TYPE_NAME(system_type_id) = N'datetime2'
      AND scale = 7
  )
    THROW 50019, '[cms].[NewsImages].[CreatedAt] no es DATETIME2(7).', 1;

  IF EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = @NewsImagesObjectId
      AND name = N'CreatedAt'
      AND is_nullable = 1
  )
  BEGIN
    EXEC sys.sp_executesql N'
      UPDATE [cms].[NewsImages]
      SET [CreatedAt] = SYSUTCDATETIME()
      WHERE [CreatedAt] IS NULL;

      ALTER TABLE [cms].[NewsImages]
        ALTER COLUMN [CreatedAt] DATETIME2(7) NOT NULL;';
  END;

  IF NOT EXISTS (
    SELECT 1
    FROM sys.default_constraints AS dc
    INNER JOIN sys.columns AS c
      ON c.object_id = dc.parent_object_id
     AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = @NewsImagesObjectId
      AND c.name = N'CreatedAt'
  )
  BEGIN
    IF OBJECT_ID(N'[cms].[DF_NewsImages_CreatedAt]', N'D') IS NOT NULL
      THROW 50020, 'DF_NewsImages_CreatedAt ya existe pero no esta asociada a CreatedAt.', 1;

    EXEC sys.sp_executesql N'
      ALTER TABLE [cms].[NewsImages]
        ADD CONSTRAINT [DF_NewsImages_CreatedAt]
        DEFAULT (SYSUTCDATETIME()) FOR [CreatedAt];';
  END;

  IF EXISTS (
    SELECT 1
    FROM sys.default_constraints AS dc
    INNER JOIN sys.columns AS c
      ON c.object_id = dc.parent_object_id
     AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = @NewsImagesObjectId
      AND c.name = N'CreatedAt'
      AND REPLACE(
            REPLACE(
              REPLACE(LOWER(dc.definition), N'(', N''),
              N')',
              N''
            ),
            N' ',
            N''
          ) <> N'sysutcdatetime'
  )
    THROW 50021, 'El DEFAULT existente de CreatedAt no usa SYSUTCDATETIME().', 1;

  /*
    Conserva el orden relativo de valores positivos existentes. Los NULL,
    cero, negativos, duplicados y huecos se normalizan a una secuencia 1..N.
  */
  ;WITH RankedImages AS (
    SELECT
      [SortOrder],
      CONVERT(INT, ROW_NUMBER() OVER (
        PARTITION BY [NewsId]
        ORDER BY
          CASE WHEN [SortOrder] IS NOT NULL AND [SortOrder] >= 1 THEN 0 ELSE 1 END,
          CASE WHEN [SortOrder] IS NOT NULL AND [SortOrder] >= 1
            THEN [SortOrder] ELSE 2147483647 END,
          [NewsImageId]
      )) AS [NormalizedSortOrder]
    FROM [cms].[NewsImages]
  )
  UPDATE RankedImages
  SET [SortOrder] = [NormalizedSortOrder]
  WHERE [SortOrder] IS NULL
     OR [SortOrder] <> [NormalizedSortOrder];

  IF EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = @NewsImagesObjectId
      AND name = N'SortOrder'
      AND is_nullable = 1
  )
  BEGIN
    ALTER TABLE [cms].[NewsImages]
      ALTER COLUMN [SortOrder] INT NOT NULL;
  END;

  IF NOT EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE parent_object_id = @NewsImagesObjectId
      AND name = N'CK_NewsImages_SortOrder_Positive'
  )
  BEGIN
    ALTER TABLE [cms].[NewsImages] WITH CHECK
      ADD CONSTRAINT [CK_NewsImages_SortOrder_Positive]
      CHECK ([SortOrder] >= 1);
  END;

  ALTER TABLE [cms].[NewsImages]
    CHECK CONSTRAINT [CK_NewsImages_SortOrder_Positive];

  EXEC sys.sp_executesql N'
    -- Si habia varias portadas, conserva la primera segun el orden estable.
    ;WITH RankedCovers AS (
      SELECT
        [IsCover],
        ROW_NUMBER() OVER (
          PARTITION BY [NewsId]
          ORDER BY [SortOrder], [NewsImageId]
        ) AS [CoverPosition]
      FROM [cms].[NewsImages]
      WHERE [IsCover] = 1
    )
    UPDATE RankedCovers
    SET [IsCover] = 0
    WHERE [CoverPosition] > 1;

    -- Toda noticia que ya tenga imagenes queda con una portada.
    ;WITH CoverCandidates AS (
      SELECT
        [IsCover],
        ROW_NUMBER() OVER (
          PARTITION BY [NewsId]
          ORDER BY [SortOrder], [NewsImageId]
        ) AS [ImagePosition],
        SUM(CASE WHEN [IsCover] = 1 THEN 1 ELSE 0 END) OVER (
          PARTITION BY [NewsId]
        ) AS [CoverCount]
      FROM [cms].[NewsImages]
    )
    UPDATE CoverCandidates
    SET [IsCover] = 1
    WHERE [ImagePosition] = 1
      AND [CoverCount] = 0;';

  IF @TargetImageUrlMaxLengthBytes <> -1
     AND EXISTS (
       SELECT 1
       FROM [cms].[News] AS n
       WHERE NULLIF(LTRIM(RTRIM(CONVERT(NVARCHAR(MAX), n.[ImageUrl]))), N'') IS NOT NULL
         AND DATALENGTH(CONVERT(NVARCHAR(MAX), n.[ImageUrl]))
           > @TargetImageUrlMaxLengthBytes
         AND NOT EXISTS (
           SELECT 1
           FROM [cms].[NewsImages] AS existingImage
           WHERE existingImage.[NewsId] = n.[NewsId]
             AND LTRIM(RTRIM(existingImage.[ImageUrl]))
               = LTRIM(RTRIM(CONVERT(NVARCHAR(MAX), n.[ImageUrl])))
         )
     )
    THROW 50022, 'Hay ImageUrl legadas que exceden la longitud de cms.NewsImages.ImageUrl.', 1;

  DECLARE @BackfillSql NVARCHAR(MAX) = N'
    INSERT INTO [cms].[NewsImages] (
      [NewsImageId],
      [NewsId],
      [ImageUrl],
      [Caption],
      [SortOrder],
      [BlobName],
      [IsCover],
      [CreatedAt]
    )
    SELECT
      NEWID(),
      n.[NewsId],
      n.[ImageUrl],
      NULL,
      CASE
        WHEN imageStats.[ImageCount] = 0 THEN 1
        ELSE imageStats.[MaxSortOrder] + 1
      END,
      NULL,
      CASE
        WHEN imageStats.[ImageCount] = 0 THEN CAST(1 AS BIT)
        WHEN imageStats.[CoverCount] = 0 THEN CAST(1 AS BIT)
        ELSE CAST(0 AS BIT)
      END,
      SYSUTCDATETIME()
    FROM [cms].[News] AS n
    OUTER APPLY (
      SELECT
        COUNT_BIG(*) AS [ImageCount],
        ISNULL(MAX(existingImage.[SortOrder]), 0) AS [MaxSortOrder],
        ISNULL(SUM(CASE WHEN existingImage.[IsCover] = 1 THEN 1 ELSE 0 END), 0)
          AS [CoverCount]
      FROM [cms].[NewsImages] AS existingImage WITH (UPDLOCK, HOLDLOCK)
      WHERE existingImage.[NewsId] = n.[NewsId]
    ) AS imageStats
    WHERE NULLIF(LTRIM(RTRIM(CONVERT(NVARCHAR(MAX), n.[ImageUrl]))), N'''') IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM [cms].[NewsImages] AS duplicateImage WITH (UPDLOCK, HOLDLOCK)
        WHERE duplicateImage.[NewsId] = n.[NewsId]
          AND LTRIM(RTRIM(duplicateImage.[ImageUrl]))
            = LTRIM(RTRIM(CONVERT(NVARCHAR(MAX), n.[ImageUrl])))
      );

    SET @InsertedRows = @@ROWCOUNT;

    -- Salvaguarda para ambientes que ya tenian imagenes pero ninguna portada.
    ;WITH CoverCandidates AS (
      SELECT
        [IsCover],
        ROW_NUMBER() OVER (
          PARTITION BY [NewsId]
          ORDER BY [SortOrder], [NewsImageId]
        ) AS [ImagePosition],
        SUM(CASE WHEN [IsCover] = 1 THEN 1 ELSE 0 END) OVER (
          PARTITION BY [NewsId]
        ) AS [CoverCount]
      FROM [cms].[NewsImages]
    )
    UPDATE CoverCandidates
    SET [IsCover] = 1
    WHERE [ImagePosition] = 1
      AND [CoverCount] = 0;';

  EXEC sys.sp_executesql
    @BackfillSql,
    N'@InsertedRows INT OUTPUT',
    @InsertedRows = @BackfilledRows OUTPUT;

  IF EXISTS (
    SELECT 1
    FROM [cms].[NewsImages]
    GROUP BY [NewsId], [SortOrder]
    HAVING COUNT_BIG(*) > 1
  )
    THROW 50023, 'La normalizacion no pudo resolver todos los SortOrder duplicados.', 1;

  IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes AS i
    WHERE i.object_id = @NewsImagesObjectId
      AND i.is_unique = 1
      AND i.is_hypothetical = 0
      AND i.has_filter = 0
      AND 2 = (
        SELECT COUNT(*)
        FROM sys.index_columns AS keyColumn
        WHERE keyColumn.object_id = i.object_id
          AND keyColumn.index_id = i.index_id
          AND keyColumn.key_ordinal > 0
      )
      AND EXISTS (
        SELECT 1
        FROM sys.index_columns AS keyColumn
        INNER JOIN sys.columns AS c
          ON c.object_id = keyColumn.object_id
         AND c.column_id = keyColumn.column_id
        WHERE keyColumn.object_id = i.object_id
          AND keyColumn.index_id = i.index_id
          AND keyColumn.key_ordinal = 1
          AND c.name = N'NewsId'
      )
      AND EXISTS (
        SELECT 1
        FROM sys.index_columns AS keyColumn
        INNER JOIN sys.columns AS c
          ON c.object_id = keyColumn.object_id
         AND c.column_id = keyColumn.column_id
        WHERE keyColumn.object_id = i.object_id
          AND keyColumn.index_id = i.index_id
          AND keyColumn.key_ordinal = 2
          AND c.name = N'SortOrder'
      )
  )
  BEGIN
    IF EXISTS (
      SELECT 1
      FROM sys.indexes
      WHERE object_id = @NewsImagesObjectId
        AND name = N'UX_NewsImages_NewsId_SortOrder'
    )
      THROW 50024, 'UX_NewsImages_NewsId_SortOrder existe con una definicion diferente.', 1;

    CREATE UNIQUE INDEX [UX_NewsImages_NewsId_SortOrder]
      ON [cms].[NewsImages] ([NewsId], [SortOrder]);
  END;

  EXEC sys.sp_executesql N'
    IF EXISTS (
      SELECT 1
      FROM [cms].[NewsImages]
      WHERE [IsCover] = 1
      GROUP BY [NewsId]
      HAVING COUNT_BIG(*) > 1
    )
      THROW 50025, ''La normalizacion no pudo resolver todas las portadas duplicadas.'', 1;';

  IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes AS i
    WHERE i.object_id = @NewsImagesObjectId
      AND i.is_unique = 1
      AND i.is_hypothetical = 0
      AND i.has_filter = 1
      AND i.filter_definition LIKE N'%IsCover%'
      AND i.filter_definition LIKE N'%1%'
      AND 1 = (
        SELECT COUNT(*)
        FROM sys.index_columns AS keyColumn
        WHERE keyColumn.object_id = i.object_id
          AND keyColumn.index_id = i.index_id
          AND keyColumn.key_ordinal > 0
      )
      AND EXISTS (
        SELECT 1
        FROM sys.index_columns AS keyColumn
        INNER JOIN sys.columns AS c
          ON c.object_id = keyColumn.object_id
         AND c.column_id = keyColumn.column_id
        WHERE keyColumn.object_id = i.object_id
          AND keyColumn.index_id = i.index_id
          AND keyColumn.key_ordinal = 1
          AND c.name = N'NewsId'
      )
  )
  BEGIN
    IF EXISTS (
      SELECT 1
      FROM sys.indexes
      WHERE object_id = @NewsImagesObjectId
        AND name = N'UX_NewsImages_OneCoverPerNews'
    )
      THROW 50026, 'UX_NewsImages_OneCoverPerNews existe con una definicion diferente.', 1;

    EXEC sys.sp_executesql N'
      CREATE UNIQUE INDEX [UX_NewsImages_OneCoverPerNews]
        ON [cms].[NewsImages] ([NewsId])
        WHERE [IsCover] = 1;';
  END;

  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF XACT_STATE() <> 0
    ROLLBACK TRANSACTION;

  THROW;
END CATCH;

/* Consultas de verificacion no destructivas. */

SELECT
  N'Noticias con cms.News.ImageUrl valido' AS [Metric],
  COUNT_BIG(*) AS [Value]
FROM [cms].[News]
WHERE NULLIF(LTRIM(RTRIM(CONVERT(NVARCHAR(MAX), [ImageUrl]))), N'') IS NOT NULL;

SELECT
  N'Registros insertados por esta ejecucion' AS [Metric],
  CONVERT(BIGINT, @BackfilledRows) AS [Value];

SELECT
  N'Total de registros en cms.NewsImages' AS [Metric],
  COUNT_BIG(*) AS [Value]
FROM [cms].[NewsImages];

SELECT
  N'Noticias sin registros en cms.NewsImages' AS [Metric],
  COUNT_BIG(*) AS [Value]
FROM [cms].[News] AS n
WHERE NOT EXISTS (
  SELECT 1
  FROM [cms].[NewsImages] AS ni
  WHERE ni.[NewsId] = n.[NewsId]
);

EXEC sys.sp_executesql N'
  SELECT
    [NewsId],
    COUNT_BIG(*) AS [CoverCount]
  FROM [cms].[NewsImages]
  WHERE [IsCover] = 1
  GROUP BY [NewsId]
  HAVING COUNT_BIG(*) > 1;

  SELECT
    [NewsId],
    COUNT_BIG(*) AS [ImageCount]
  FROM [cms].[NewsImages]
  GROUP BY [NewsId]
  HAVING SUM(CASE WHEN [IsCover] = 1 THEN 1 ELSE 0 END) = 0;';

SELECT
  [NewsId],
  [SortOrder],
  COUNT_BIG(*) AS [DuplicateCount]
FROM [cms].[NewsImages]
GROUP BY [NewsId], [SortOrder]
HAVING COUNT_BIG(*) > 1;

SELECT
  [NewsImageId],
  [NewsId],
  [SortOrder]
FROM [cms].[NewsImages]
WHERE [SortOrder] < 1;

SELECT
  ni.[NewsImageId],
  ni.[NewsId],
  ni.[ImageUrl]
FROM [cms].[NewsImages] AS ni
LEFT JOIN [cms].[News] AS n
  ON n.[NewsId] = ni.[NewsId]
WHERE n.[NewsId] IS NULL;

SELECT
  [NewsId],
  LTRIM(RTRIM([ImageUrl])) AS [NormalizedImageUrl],
  COUNT_BIG(*) AS [DuplicateCount]
FROM [cms].[NewsImages]
GROUP BY [NewsId], LTRIM(RTRIM([ImageUrl]))
HAVING COUNT_BIG(*) > 1;

EXEC sys.sp_executesql N'
  SELECT
    N''Imagenes con BlobName NULL (incluye las migradas)'' AS [Metric],
    COUNT_BIG(*) AS [Value]
  FROM [cms].[NewsImages]
  WHERE [BlobName] IS NULL;

  SELECT
    n.[NewsId],
    n.[ImageUrl] AS [LegacyImageUrl],
    coverImage.[ImageUrl] AS [CoverImageUrl],
    CASE
      WHEN coverImage.[ImageUrl] IS NULL THEN N''Sin portada registrada''
      WHEN LTRIM(RTRIM(CONVERT(NVARCHAR(MAX), n.[ImageUrl])))
             = LTRIM(RTRIM(coverImage.[ImageUrl])) THEN N''Coincide''
      ELSE N''Difiere''
    END AS [Comparison]
  FROM [cms].[News] AS n
  OUTER APPLY (
    SELECT TOP (1)
      ni.[ImageUrl]
    FROM [cms].[NewsImages] AS ni
    WHERE ni.[NewsId] = n.[NewsId]
      AND ni.[IsCover] = 1
    ORDER BY ni.[SortOrder], ni.[NewsImageId]
  ) AS coverImage
  WHERE NULLIF(
    LTRIM(RTRIM(CONVERT(NVARCHAR(MAX), n.[ImageUrl]))),
    N''''
  ) IS NOT NULL
  ORDER BY n.[NewsId];';
