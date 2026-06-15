export type ServicePage = {
  slug: string;
  title: string;
  eyebrow?: string;
  summary?: string;
  mediaType: "image" | "video";
  mediaSrc: string;
  poster?: string;
  paragraphs: string[];
};

export const servicePages: ServicePage[] = [
  {
    slug: "orientacion-primaria-salud",
    title: "Orientación Primaria de Salud",
    eyebrow: "Servicio comunitario",
    summary: "Orientación médica inicial y apoyo oportuno para resolver dudas de salud.",
    mediaType: "image",
    mediaSrc: "/ORIENTACION-PRIMARIA-SALUD.jpg",
    paragraphs: [
      "Acceso Rápido a Asesoría Médica Online: Nuestro servicio de orientación médica inicial online está diseñado para brindar una primera evaluación profesional y asesoramiento en temas de salud, facilitando a las personas tomar decisiones informadas sobre los pasos a seguir.",
      "Atención Personalizada y Oportuna Online: A través de consultas online, nuestros especialistas evalúan síntomas, responden dudas y orientan sobre posibles tratamientos o derivaciones, asegurando un apoyo oportuno y accesible.",
      "Servicio a Comunidades y Organizaciones: Ofrecemos este servicio en colaboración con comunidades y organizaciones, promoviendo el bienestar general a través de orientación médica confiable y accesible para todos.",
    ],
  },
  {
    slug: "apoyo-legal-personal",
    title: "Apoyo Legal Personal",
    eyebrow: "Servicio comunitario",
    summary: "Orientación legal inicial para consultas personales y familiares.",
    mediaType: "image",
    mediaSrc: "/APOYO-LEGAL-PERSONAL.jpg",
    paragraphs: [
      "Acceso Rápido a Asesoría Médica Online: Nuestro servicio de orientación médica inicial online está diseñado para brindar una primera evaluación profesional y asesoramiento en temas de salud, facilitando a las personas tomar decisiones informadas sobre los pasos a seguir.",
      "Atención Personalizada y Oportuna Online: A través de consultas online, nuestros especialistas evalúan síntomas, responden dudas y orientan sobre posibles tratamientos o derivaciones, asegurando un apoyo oportuno y accesible.",
      "Servicio a Comunidades y Organizaciones: Ofrecemos este servicio en colaboración con comunidades y organizaciones, promoviendo el bienestar general a través de orientación médica confiable y accesible para todos.",
    ],
  },
  {
    slug: "apoyo-psicologico-individual",
    title: "Apoyo Psicológico Individual",
    eyebrow: "Servicio comunitario",
    summary: "Acompañamiento emocional inicial y contención profesional.",
    mediaType: "image",
    mediaSrc: "/APOYO-PSICOLOGICO-INDIVIDUAL.jpg",
    paragraphs: [
      "Bienestar Emocional Personalizado Online: Ofrecemos un espacio seguro y confidencial donde las personas pueden abordar sus preocupaciones emocionales, mejorar su bienestar mental y fortalecer su resiliencia frente a los desafíos de la vida diaria.",
      "Atención Profesional y Cercana Online: Contamos con psicólogos especializados que brindan orientación personalizada online, ayudando a identificar y gestionar situaciones como estrés, ansiedad, depresión y conflictos interpersonales.",
      "Impacto en Comunidades: Trabajamos junto a comunidades para fomentar el acceso a recursos de salud mental, contribuyendo a un entorno más saludable y equilibrado para todos. ",
    ],
  },
  {
    slug: "apoyo-psicologico-laboral",
    title: "Apoyo Psicológico Laboral",
    eyebrow: "Servicio comunitario",
    summary: "Apoyo enfocado en bienestar laboral, estrés y adaptación.",
    mediaType: "image",
    mediaSrc: "/APOYO-PSICOLOGICO-LABORAL.jpg",
    paragraphs: [
      "Preparación para el Mercado Laboral Online: Nuestro servicio está orientado a fortalecer las habilidades personales y profesionales necesarias para enfrentar con éxito los procesos de búsqueda y selección de empleo.",
      "Desarrollo de Competencias Clave Online: Brindamos orientación personalizada online para mejorar habilidades como comunicación efectiva, manejo de entrevistas laborales, trabajo en equipo y gestión del tiempo, adaptadas a las demandas actuales del mercado laboral.",
      "Apoyo Psicológico para la Empleabilidad Online: Ayudamos a superar barreras emocionales como la inseguridad o el estrés durante la búsqueda de empleo, potenciando la autoconfianza y la resiliencia de los participantes.",
    ],
  },
  {
    slug: "apoyo-educacional-integral",
    title: "Apoyo Educacional Integral",
    eyebrow: "Servicio comunitario",
    summary: "Orientación y acompañamiento para fortalecer trayectorias educativas.",
    mediaType: "image",
    mediaSrc: "/APOYO-EDUCACIONAL-INTEGRAL.jpg",
    paragraphs: [
      "Refuerzo Escolar Personalizado Online: Nuestro servicio de refuerzo escolar está diseñado para apoyar a estudiantes en su proceso educativo. Con un enfoque individualizado, ayudamos a cada estudiante a superar desafíos académicos y alcanzar su máximo potencial.",
      "Psicopedagogía para el Desarrollo del Aprendizaje Online: Contamos con psicopedagogos especializados que trabajan de manera personalizada para identificar y abordar dificultades en el aprendizaje. Nuestro objetivo es fortalecer las habilidades cognitivas y emocionales de los estudiantes, promoviendo su éxito académico y personal.",
      "Servicio a Comunidades y Escuelas Online: Trabajamos en colaboración con comunidades y centros educativos, desarrollando programas de apoyo escolar y psicopedagógico que se adaptan a las necesidades específicas de cada entorno, contribuyendo al desarrollo educativo integral. ",
    ],
  },
  {
    slug: "asesoria-fomento-productivo",
    title: "Asesoría Fomento Productivo",
    eyebrow: "Servicio comunitario",
    summary: "Apoyo a iniciativas productivas y desarrollo económico local.",
    mediaType: "image",
    mediaSrc: "/ASESORIA-FOMENTO-PRODUCTIVO.jpg",
    paragraphs: [
      "Impulso al Emprendimiento Local Online: Brindamos apoyo integral para que emprendedores y pequeñas empresas inicien y desarrollen nuevos negocios, contribuyendo al crecimiento económico y social de sus comunidades.",
      "Asesoría en Creación de Negocios Online: Ofrecemos orientación personalizada para transformar ideas en proyectos sólidos, ayudando en la elaboración de planes de negocio, análisis de viabilidad y estrategias de mercado.",
      "Asesoría en Proyectos de Negocio Online: Acompañamos en la planificación, gestión y ejecución de proyectos productivos, proporcionando herramientas para el diseño de modelos de negocio sostenibles y rentables.",
      "Acceso a Financiamiento y Redes de Apoyo: Facilitamos la conexión con programas de financiamiento, subvenciones y redes de apoyo empresarial, asegurando que los beneficiarios puedan llevar sus proyectos al siguiente nivel.",
      "Colaboración con Comunidades y Organizaciones: Trabajamos junto a comunidades para desarrollar estrategias productivas que promuevan el desarrollo económico local, generando empleo y fortaleciendo el tejido empresarial. ",
    ],
  },
  {
    slug: "agenda-comunitaria",
    title: "Agenda Comunitaria",
    eyebrow: "Servicio comunitario",
    summary: "Organización de actividades, hitos y espacios de encuentro.",
    mediaType: "image",
    mediaSrc: "/AGENDA-COMUNITARIA.jpg",
    paragraphs: [
      
      "La Agenda Comunitaria es un espacio donde la comunidad comparte con sus miembros y socios información clave, como asambleas, fechas de festividades, oportunidades laborales y otros eventos relevantes. Este espacio es administrado y actualizado por la directiva comunitaria, asegurando su relevancia y utilidad.",
    ],
  },
  {
    slug: "puntos-de-conectividad",
    title: "Puntos de Conectividad",
    eyebrow: "Servicio comunitario",
    summary: "Acceso digital y herramientas tecnológicas en el territorio.",
    mediaType: "image",
    mediaSrc: "/PUNTOS-DE-CONECTIVIDAD.jpg",
    paragraphs: [
      
      "Puntos de Conectividad para Zonas Remotas: Llevamos internet satelital a comunidades de difícil acceso mediante antenas instaladas en techumbres. El sistema incluye un router que distribuye la conexión inalámbrica, permitiendo el acceso a servicios digitales en computadores y dispositivos inteligentes. La instalación es rápida, segura y transforma la conectividad en zonas remotas con una conexión estable y confiable.",
    ],
  },
  {
    slug: "acceso-universal",
    title: "Acceso Universal",
    eyebrow: "Servicio comunitario",
    summary: "Inclusión y acceso más amplio a servicios y recursos.",
    mediaType: "image",
    mediaSrc: "/ACCESO-UNIVERSAL.jpg",
    paragraphs: [
      "En Conexión Circular estamos comprometidos con el acceso universal de todos nuestros usuarios a los distintos servicios de nuestro portal. Es por ello, que prestamos ayuda para acceder o utilizar los servicios de nuestra plataforma.",
      "En caso de requerirlo, estará a disposición un formulario de contacto, que se encuentra en la parte superior de la pantalla. ",
      "Una vez recibido el formulario, coordinaremos el servicio de asistencia de acceso universal. ",
    ],
  },
];

export function getServiceBySlug(slug: string) {
  return servicePages.find((service) => service.slug === slug);
}