// Fonction serverless Vercel — reçoit le formulaire de contact et envoie l'email
// directement via le SMTP de la boîte mail existante (Online.net / Scaleway).
// Aucune inscription à un service tiers : on utilise le compte email déjà actif.
//
// Variables d'environnement à définir dans Vercel
// (Project ccb → Settings → Environment Variables) :
//   SMTP_HOST        — serveur SMTP sortant (généralement "smtp.online.net" pour
//                       une boîte mail hébergée chez Online.net/Scaleway — à vérifier
//                       dans la console Scaleway, section "Mail" / paramètres du webmail)
//   SMTP_PORT        — port SMTP (587 en général, avec STARTTLS)
//   SMTP_USER        — adresse complète de la boîte (ex: contact@steccb.com)
//   SMTP_PASS        — mot de passe de cette boîte mail
//   CONTACT_TO_EMAIL — adresse de destination (souvent la même que SMTP_USER)
//
// ⚠️ Ces valeurs se saisissent UNIQUEMENT dans le dashboard Vercel, jamais dans le code.

import nodemailer from 'nodemailer';

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

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.error('Variables SMTP manquantes dans les variables d\'environnement Vercel.');
    return res.status(500).json({ error: 'Configuration serveur incomplète.' });
  }

  const to = process.env.CONTACT_TO_EMAIL || SMTP_USER;
  const port = Number(SMTP_PORT) || 587;

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
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: port === 465,       // true pour le port 465 (SSL direct), false pour 587 (STARTTLS)
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    await transporter.sendMail({
      from: `"CCB — Site web" <${SMTP_USER}>`,
      to,
      replyTo: email,
      subject: `Nouvelle demande de devis — ${prenom} ${nom}`,
      html,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Contact form SMTP error:', err);
    return res.status(502).json({ error: 'Échec de l\'envoi de l\'email.' });
  }
}
