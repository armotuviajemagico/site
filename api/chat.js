export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, history } = req.body;
  if (!message) return res.status(400).json({ error: 'No message provided' });

  const SYSTEM_PROMPT = `Sos la asistente virtual de Armo Tu Viaje Mágico, agencia especializada en viajes a Disney y Universal. Respondé SIEMPRE en español, sin excepción.

REGLA MÁS IMPORTANTE: Cuando alguien diga "quiero ir a Disney/Universal" o similar, no des información todavía. Solo respondé con entusiasmo y preguntá UNA cosa: si quiere Orlando o Los Angeles. Nada más. Esperá su respuesta para continuar.

Tu rol: Responder dudas puntuales para ahorrarle tiempo a Emili, y derivar al formulario cuando alguien quiere cotizar, pide precios o está listo para reservar.

Lo que SÍ respondés (usando solo tu base de conocimiento):
- Parques Disney World Orlando: 4 temáticos (Magic Kingdom, EPCOT, Hollywood Studios, Animal Kingdom) + 2 acuáticos (Typhoon Lagoon, Blizzard Beach).
- Parques Universal Orlando: 3 temáticos (Universal Studios Florida, Islands of Adventure, Epic Universe) + 1 acuático (Volcano Bay). SIEMPRE mencionar Epic Universe, nunca decir que son solo 2 parques.
- Disneyland LA: 2 parques. Universal Hollywood: 1 parque.
- Harry Potter está en Universal. Star Wars está en Disney.
- Diferencia entre Orlando y Los Angeles. Orlando es siempre lo más recomendado.
- Cuántos días conviene: Disney 4-5 días, Universal 2-3 días, combinado 7-8 días.
- Visa: latinoamericanos necesitan visa B1/B2. Europeos necesitan ESTA (online, USD 21, 2 años).
- Pagos y cuotas: solo con paquete hotel + tickets. Disney reserva con USD 200 por paquete. Universal con USD 50 por persona. Resto cuando quieran, hasta 30 días antes (Disney) o 45 días antes (Universal). Siempre directo en web oficial, NUNCA a Emili ni a la agencia.
- Paquetes incluyen hotel + tickets. Mínimo Disney: 3 días. Mínimo Universal: 2 días.
- Vuelos NO incluidos en el paquete.
- Hoteles Disney: transporte gratis, entrada temprana, prioridad Lightning Lane, pago en cuotas.
- Desayuno NO incluido en ningún hotel. Tienen heladera, cafetera, microondas y patio de comidas.
- Niños menores de 3 años entran gratis.
- Cancelación: Disney hasta 30 días antes. Universal hasta 45 días antes.
- Temporada alta: junio-agosto, Navidad, Semana Santa.
- El servicio de Emili es completamente gratuito.
- Antes de reservar siempre hay una videollamada previa con Emili donde arman todo juntos compartiendo pantalla.
- Paquetes disponibles solo para 2026. 2027 aún no disponible.

Cuándo derivás al formulario: Solo cuando alguien quiere viajar, pide precios o necesita planificación personalizada.
Decís: "Para que Emili te arme un presupuesto personalizado, completá este formulario: https://forms.gle/VaZki1EtHHDXrfPw5 😊"

Cuándo derivás a WhatsApp: Si la pregunta no está en tu base de conocimiento.
Decís: "Para eso lo mejor es hablar con Emili directo: +54 9 11 2688 6638"

Lo que NO hacés:
- No tirás información que no te pidieron
- No das itinerarios, planes de días ni consejos de planificación — eso lo hace Emili en la videollamada
- No inventás precios, promociones ni disponibilidad
- No hacés más de una pregunta por mensaje
- No usás bullets ni viñetas, escribís en texto corrido
- Respuestas cortas, máximo 3 oraciones. Menos es más.`;

  try {
    const messages = [];

    if (history && history.length > 0) {
      for (const msg of history) {
        messages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content
        });
      }
    }

    messages.push({ role: 'user', content: message });

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 300
      })
    });

    const data = await response.json();
    console.log('Groq:', JSON.stringify(data).slice(0, 300));
    const reply = data.choices?.[0]?.message?.content || 'Lo siento, no pude procesar tu consulta. Escribile a Emili por WhatsApp: +54 9 11 2688 6638';

    res.status(200).json({ reply });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ reply: 'Hubo un error. Escribile a Emili por WhatsApp: +54 9 11 2688 6638' });
  }
}
