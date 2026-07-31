/*
  ROLLBACK MANUAL Y PELIGROSO DE LA ACTUALIZACION DE cms.NewsImages

  Este archivo no contiene operaciones destructivas activas.

  Antes de considerar un rollback:
  1. Desplegar una version de la aplicacion que use solamente
     [cms].[News].[ImageUrl].
  2. Confirmar que la portada efectiva de cada noticia este reflejada en
     [cms].[News].[ImageUrl].
  3. Respaldar [cms].[NewsImages].

  Este diagnostico:
  - No borra [cms].[NewsImages].
  - No elimina las imagenes migradas.
  - No modifica ni elimina [cms].[News].[ImageUrl].
  - No elimina blobs de Azure.
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;

IF OBJECT_ID(N'[cms].[News]', N'U') IS NULL
  THROW 50101, 'No existe [cms].[News]; no se puede verificar el rollback.', 1;

IF OBJECT_ID(N'[cms].[NewsImages]', N'U') IS NULL
  THROW 50102, 'No existe [cms].[NewsImages]; no se puede verificar el rollback.', 1;

DECLARE @CoverDifferenceCount BIGINT;

SELECT @CoverDifferenceCount = COUNT_BIG(*)
FROM [cms].[News] AS n
OUTER APPLY (
  SELECT TOP (1)
    ni.[ImageUrl]
  FROM [cms].[NewsImages] AS ni
  WHERE ni.[NewsId] = n.[NewsId]
    AND ni.[IsCover] = 1
  ORDER BY ni.[SortOrder], ni.[NewsImageId]
) AS coverImage
WHERE EXISTS (
  SELECT 1
  FROM [cms].[NewsImages] AS anyImage
  WHERE anyImage.[NewsId] = n.[NewsId]
)
  AND (
    coverImage.[ImageUrl] IS NULL
    OR ISNULL(LTRIM(RTRIM(CONVERT(NVARCHAR(MAX), n.[ImageUrl]))), N'')
         COLLATE Latin1_General_100_BIN2
       <> ISNULL(LTRIM(RTRIM(coverImage.[ImageUrl])), N'')
         COLLATE Latin1_General_100_BIN2
  );

SELECT
  n.[NewsId],
  n.[ImageUrl] AS [LegacyImageUrl],
  coverImage.[ImageUrl] AS [CoverImageUrl]
FROM [cms].[News] AS n
OUTER APPLY (
  SELECT TOP (1)
    ni.[ImageUrl]
  FROM [cms].[NewsImages] AS ni
  WHERE ni.[NewsId] = n.[NewsId]
    AND ni.[IsCover] = 1
  ORDER BY ni.[SortOrder], ni.[NewsImageId]
) AS coverImage
WHERE EXISTS (
  SELECT 1
  FROM [cms].[NewsImages] AS anyImage
  WHERE anyImage.[NewsId] = n.[NewsId]
)
  AND (
    coverImage.[ImageUrl] IS NULL
    OR ISNULL(LTRIM(RTRIM(CONVERT(NVARCHAR(MAX), n.[ImageUrl]))), N'')
         COLLATE Latin1_General_100_BIN2
       <> ISNULL(LTRIM(RTRIM(coverImage.[ImageUrl])), N'')
         COLLATE Latin1_General_100_BIN2
  )
ORDER BY n.[NewsId];

SELECT
  N'Portadas que difieren de cms.News.ImageUrl' AS [Metric],
  @CoverDifferenceCount AS [Value];

IF @CoverDifferenceCount > 0
  PRINT N'ROLLBACK BLOQUEADO: sincroniza primero las portadas con cms.News.ImageUrl.';
ELSE
  PRINT N'Las portadas registradas coinciden con cms.News.ImageUrl.';

/*
  OPCION RECOMENDADA:

  No revertir la estructura de la tabla. Tras desplegar la aplicacion antigua,
  se pueden conservar las columnas, indices e imagenes migradas sin impacto.

  LIMPIEZA ESTRUCTURAL OPCIONAL:

  Las siguientes operaciones son destructivas y por eso permanecen comentadas.
  Quitarian solamente los objetos agregados por update-news-images.sql; no
  eliminan la tabla ni las filas migradas. Antes de utilizarlas se debe:

  - comprobar que @CoverDifferenceCount sea 0;
  - confirmar manualmente el despliegue de la aplicacion legada;
  - respaldar la tabla;
  - revisar si otros consumidores ya dependen de estos objetos.

  No descomentar como bloque sin revisar cada sentencia.

  DROP INDEX [UX_NewsImages_OneCoverPerNews] ON [cms].[NewsImages];
  DROP INDEX [UX_NewsImages_NewsId_SortOrder] ON [cms].[NewsImages];

  ALTER TABLE [cms].[NewsImages]
    DROP CONSTRAINT [CK_NewsImages_SortOrder_Positive];

  ALTER TABLE [cms].[NewsImages]
    DROP CONSTRAINT [DF_NewsImages_IsCover];

  ALTER TABLE [cms].[NewsImages]
    DROP CONSTRAINT [DF_NewsImages_CreatedAt];

  ALTER TABLE [cms].[NewsImages]
    ALTER COLUMN [SortOrder] INT NULL;

  ALTER TABLE [cms].[NewsImages]
    DROP COLUMN [BlobName], [IsCover], [CreatedAt];

  No usar DROP TABLE. No borrar filas de cms.NewsImages. No borrar blobs.
*/
