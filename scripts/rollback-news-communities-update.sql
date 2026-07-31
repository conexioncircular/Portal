/*
  ROLLBACK MANUAL Y DE DIAGNOSTICO DE [cms].[NewsCommunities]

  Este archivo no contiene operaciones destructivas activas.

  [cms].[News].[CommunityId] se conserva como comunidad principal. Si se
  despliega el codigo antiguo, cada noticia solo se mostrara en esa comunidad;
  todas sus asociaciones adicionales dejaran de ser visibles para ese codigo.

  Antes de considerar cualquier limpieza estructural:
  1. Desplegar y validar primero la version compatible de la aplicacion.
  2. Respaldar [cms].[NewsCommunities] y [cms].[News].
  3. Confirmar manualmente que se acepta perder la pertenencia multicomunidad.
  4. Revisar si existen otros consumidores de [cms].[NewsCommunities].

  Este diagnostico:
  - No elimina la tabla ni asociaciones.
  - No modifica [cms].[News].[CommunityId].
  - No modifica [cms].[NewsImages].
  - No elimina blobs de Azure.
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;

IF SCHEMA_ID(N'cms') IS NULL
  THROW 50301, 'No existe el esquema [cms]; no se puede verificar el rollback.', 1;

IF OBJECT_ID(N'[cms].[News]', N'U') IS NULL
  THROW 50302, 'No existe [cms].[News]; no se puede verificar el rollback.', 1;

IF OBJECT_ID(N'[cms].[Communities]', N'U') IS NULL
  THROW 50303, 'No existe [cms].[Communities]; no se puede verificar el rollback.', 1;

IF OBJECT_ID(N'[cms].[NewsCommunities]', N'U') IS NULL
  THROW 50304, 'No existe [cms].[NewsCommunities]; no hay estructura multicomunidad que diagnosticar.', 1;

/*
  SQL dinamico mantiene seguras las referencias si el archivo se abre o valida
  en una base donde la tabla condicional todavia no existe.
*/
EXEC sys.sp_executesql N'
  SELECT
    N''Noticias totales'' AS [Metric],
    COUNT_BIG(*) AS [Value]
  FROM [cms].[News];

  SELECT
    N''Asociaciones multicomunidad totales'' AS [Metric],
    COUNT_BIG(*) AS [Value]
  FROM [cms].[NewsCommunities];

  SELECT
    n.[NewsId],
    n.[CommunityId] AS [LegacyPrimaryCommunityId]
  FROM [cms].[News] AS n
  WHERE n.[CommunityId] IS NULL
     OR NOT EXISTS (
       SELECT 1
       FROM [cms].[Communities] AS c
       WHERE c.[CommunityId] = n.[CommunityId]
     )
  ORDER BY n.[NewsId];

  SELECT
    n.[NewsId],
    n.[CommunityId] AS [LegacyPrimaryCommunityId]
  FROM [cms].[News] AS n
  WHERE n.[CommunityId] IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM [cms].[NewsCommunities] AS nc
      WHERE nc.[NewsId] = n.[NewsId]
        AND nc.[CommunityId] = n.[CommunityId]
    )
  ORDER BY n.[NewsId];

  SELECT
    n.[NewsId],
    n.[CommunityId] AS [LegacyPrimaryCommunityId],
    COUNT_BIG(nc.[CommunityId]) AS [CurrentCommunityCount],
    SUM(
      CASE WHEN nc.[CommunityId] <> n.[CommunityId] THEN CONVERT(BIGINT, 1)
           ELSE CONVERT(BIGINT, 0)
      END
    ) AS [AssociationsNotVisibleToOldCode]
  FROM [cms].[News] AS n
  INNER JOIN [cms].[NewsCommunities] AS nc
    ON nc.[NewsId] = n.[NewsId]
  GROUP BY n.[NewsId], n.[CommunityId]
  HAVING COUNT_BIG(nc.[CommunityId]) > 1
  ORDER BY n.[NewsId];

  SELECT
    nc.[NewsId],
    nc.[CommunityId] AS [AdditionalCommunityId],
    n.[CommunityId] AS [LegacyPrimaryCommunityId]
  FROM [cms].[NewsCommunities] AS nc
  INNER JOIN [cms].[News] AS n
    ON n.[NewsId] = nc.[NewsId]
  WHERE nc.[CommunityId] <> n.[CommunityId]
  ORDER BY nc.[NewsId], nc.[CommunityId];

  SELECT
    N''Noticias que el codigo antiguo mostrara solo en su comunidad principal'' AS [Metric],
    COUNT_BIG(*) AS [Value]
  FROM (
    SELECT nc.[NewsId]
    FROM [cms].[NewsCommunities] AS nc
    GROUP BY nc.[NewsId]
    HAVING COUNT_BIG(*) > 1
  ) AS multicommunityNews;

  SELECT
    N''Noticias con comunidad principal valida y conservada en NewsCommunities'' AS [Metric],
    COUNT_BIG(*) AS [Value]
  FROM [cms].[News] AS n
  INNER JOIN [cms].[Communities] AS c
    ON c.[CommunityId] = n.[CommunityId]
  WHERE EXISTS (
    SELECT 1
    FROM [cms].[NewsCommunities] AS nc
    WHERE nc.[NewsId] = n.[NewsId]
      AND nc.[CommunityId] = n.[CommunityId]
  );';

PRINT N'No se realizaron cambios. El codigo antiguo solo usara cms.News.CommunityId.';
PRINT N'Las asociaciones adicionales deben conservarse salvo aprobacion destructiva explicita.';

/*
  OPERACION DESTRUCTIVA INTENCIONALMENTE DESHABILITADA

  No descomentar sin respaldo, ventana de mantenimiento y confirmacion manual.
  Eliminar la tabla descartaria informacion multicomunidad que no puede
  reconstruirse solamente desde [cms].[News].[CommunityId].

  DROP TABLE [cms].[NewsCommunities];
*/
