// Fonction serverless Vercel — reçoit le formulaire de contact et envoie l'email via Resend.
// Variables d'environnement à définir dans Vercel (Project → Settings → Environment Variables) :
//   RESEND_API_KEY   — clé API Resend (obligatoire)
//   CONTACT_TO_EMAIL — adresse de destination (ex: contact@steccb.com)
//   CONTACT_FROM     — adresse expéditrice (ex: "CCB — Site web <formulaire@steccb.com>")
//                       tant que le domaine steccb.com n'est pas vérifié dans Resend,
//                       utiliser "CCB — Site web <onboarding@resend.dev>"

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const body = req.body || {};
  const {
    prenom = '',
    nom = '',
    email = '',
    telephone = '',
    type_travaux = '',
    localisation = '',
    budget = '',
    message = '',
    rgpd,
  } = body;

  // Validation minimale côté serveur (ne jamais faire confiance au seul JS client)
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!prenom.trim() || !nom.trim() || !EMAIL_RE.test(email) || !type_travaux.trim() || !message.trim() || !rgpd) {
    return res.status(400).json({ error: 'Champs requis manquants ou invalides.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY manquante dans les variables d\'environnement Vercel.');
    return res.status(500).json({ error: 'Configuration serveur incomplète.' });
  }

  const to = process.env.CONTACT_TO_EMAIL || 'contact@steccb.com';
  const from = process.env.CONTACT_FROM || 'CCB — Site web <onboarding@resend.dev>';

  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const html = `
    <h2>Nouvelle demande de devis — site CCB</h2>
    <p><strong>Nom :</strong> ${esc(prenom)} ${esc(nom)}</p>
    <p><strong>E-mail :</strong> ${esc(email)}</p>
    <p><strong>Téléphone :</strong> ${esc(telephone) || '—'}</p>
    <p><strong>Type de travaux :</strong> ${esc(type_travaux)}</p>
    <p><strong>Commune / code postal :</strong> ${esc(localisation) || '—'}</p>
    <p><strong>Budget indicatif :</strong> ${esc(budget) || '—'}</p>
    <p><strong>Message :</strong></p>
    <p>${esc(message).replace(/\n/g, '<br>')}</p>
  `;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject: `Nouvelle demande de devis — ${prenom} ${nom}`,
        html,
      }),
    });

    if (!r.ok) {
      const errText = await r.text();
      console.error('Resend error:', r.status, errText);
      return res.status(502).json({ error: 'Échec de l\'envoi de l\'email.' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Contact form error:', err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
}
