/**
 * Telegram Bot Integration
 * Sends messages and images to a Telegram channel
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHANNEL_ID_RAW = process.env.TELEGRAM_CHANNEL_ID || '@tattariNET';

// Format group/channel ID: numeric IDs need -100 prefix for supergroups/channels
function formatChannelId(channelId: string): string {
  // If it's already a username (starts with @), return as is
  if (channelId.startsWith('@')) {
    return channelId;
  }

  // If it already starts with -100, return as is (already formatted)
  if (channelId.startsWith('-100')) {
    return channelId;
  }

  // If it's already negative (but not -100 prefix), return as is
  if (channelId.startsWith('-')) {
    return channelId;
  }

  // If it's a positive numeric ID, add -100 prefix
  const numId = parseInt(channelId);
  if (!isNaN(numId) && numId > 0) {
    // For supergroup/channel IDs, they need -100 prefix
    // Telegram supergroups/channels have IDs like -1001234567890
    const formattedId = `-100${numId}`;
    return formattedId;
  }

  // Return as is for other formats
  return channelId;
}

// Try multiple channel ID formats
async function tryChannelIds(channelIds: string[]): Promise<string | null> {
  for (const channelId of channelIds) {
    try {
      const response = await fetch(`${TELEGRAM_API_BASE}/getChat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: channelId,
        }),
      });

      const data = await response.json();

      if (data.ok) {
        return channelId;
      }
    } catch (error) {
      // Continue to next format
      continue;
    }
  }
  return null;
}

const TELEGRAM_CHANNEL_ID = formatChannelId(TELEGRAM_CHANNEL_ID_RAW);
const TELEGRAM_API_BASE = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

// Resolved channel ID (will be set after testing)
let RESOLVED_CHANNEL_ID: string | null = null;

// Debug logging
if (TELEGRAM_BOT_TOKEN) {

  // Try to resolve the correct channel ID format
  if (TELEGRAM_CHANNEL_ID_RAW && !TELEGRAM_CHANNEL_ID_RAW.startsWith('@')) {
    // Try multiple formats
    const numId = parseInt(TELEGRAM_CHANNEL_ID_RAW);
    if (!isNaN(numId)) {
      const formats = [
        `-100${numId}`,  // Standard supergroup format
        `@tattariNET`,   // Username format
        String(numId),   // Raw numeric
      ];

      // Note: We'll resolve this on first use since we can't await at module level
    }
  }
} else {
  console.warn('⚠️ TELEGRAM_BOT_TOKEN not set in environment variables');
}

interface ListingData {
  title: string;
  price?: string | number;
  brand?: string | null;
  model?: string | null;
  cpu?: string | null;
  ram_gb?: string | null;
  ram_type?: string | null;
  ram_speed_mhz?: string | null;
  storage?: any[] | null;
  gpu?: string | null;
  display_resolution?: string | null;
  screen_size_inch?: number | null;
  os?: string | null;
  condition?: string | null;
  negotiable?: boolean | null;
  battery?: string | null;
  special_features?: string[] | null;
  guarantee_months?: number | null;
  guarantee_provider?: string | null;
  images?: string[] | null;
}

/**
 * Format PC specs into a nice Telegram message
 */
function formatSpecsMessage(listing: ListingData): string {
  const lines: string[] = [];

  // Title and Price
  lines.push(`🖥️ <b>${listing.title || 'PC Listing'}</b>`);

  if (listing.price) {
    const priceStr = typeof listing.price === 'string'
      ? listing.price.replace(/[^\d]/g, '')
      : String(listing.price);
    if (priceStr) {
      lines.push(`💰 <b>Price:</b> ${parseInt(priceStr).toLocaleString()} ETB`);
    }
  }

  lines.push(''); // Empty line

  // Specs
  lines.push('📋 <b>Specifications:</b>');

  if (listing.brand || listing.model) {
    lines.push(`🖥️ <b>Brand/Model:</b> ${[listing.brand, listing.model].filter(Boolean).join(' ')}`);
  }

  if (listing.cpu) {
    lines.push(`⚙️ <b>CPU:</b> ${listing.cpu}`);
  }

  if (listing.ram_gb) {
    const ramInfo = [
      `${listing.ram_gb}GB`,
      listing.ram_type,
      listing.ram_speed_mhz ? `${listing.ram_speed_mhz}MHz` : null,
    ].filter(Boolean).join(' ');
    lines.push(`💾 <b>RAM:</b> ${ramInfo}`);
  }

  if (listing.storage && Array.isArray(listing.storage) && listing.storage.length > 0) {
    const storageInfo = listing.storage
      .map((s: any) => {
        const size = s.Size_GB ? `${s.Size_GB}GB` : '';
        const type = s.Type || '';
        return [size, type].filter(Boolean).join(' ');
      })
      .filter(Boolean)
      .join(' + ');
    if (storageInfo) {
      lines.push(`💿 <b>Storage:</b> ${storageInfo}`);
    }
  }

  if (listing.gpu) {
    lines.push(`🎮 <b>GPU:</b> ${listing.gpu}`);
  }

  if (listing.display_resolution || listing.screen_size_inch) {
    const displayParts = [
      listing.display_resolution,
      listing.screen_size_inch ? `${listing.screen_size_inch}"` : null,
    ].filter(Boolean);
    if (displayParts.length > 0) {
      lines.push(`🖥️ <b>Display:</b> ${displayParts.join(' (')}${listing.screen_size_inch ? ')' : ''}`);
    }
  }

  if (listing.os) {
    lines.push(`💻 <b>OS:</b> ${listing.os}`);
  }

  // Additional Info
  if (listing.condition || listing.battery || listing.negotiable !== null) {
    lines.push(''); // Empty line
    lines.push('ℹ️ <b>Additional Info:</b>');

    if (listing.condition) {
      lines.push(`📦 <b>Condition:</b> ${listing.condition}`);
    }

    if (listing.battery) {
      lines.push(`🔋 <b>Battery:</b> ${listing.battery}`);
    }

    if (listing.negotiable !== null) {
      lines.push(`💬 <b>Price:</b> ${listing.negotiable ? 'Negotiable' : 'Fixed'}`);
    }
  }

  if (listing.special_features && Array.isArray(listing.special_features) && listing.special_features.length > 0) {
    lines.push(`✨ <b>Special Features:</b> ${listing.special_features.join(', ')}`);
  }

  if (listing.guarantee_months || listing.guarantee_provider) {
    const guaranteeInfo = [
      listing.guarantee_months ? `${listing.guarantee_months} months` : null,
      listing.guarantee_provider || null,
    ].filter(Boolean).join(' - ');
    if (guaranteeInfo) {
      lines.push(`🛡️ <b>Guarantee:</b> ${guaranteeInfo}`);
    }
  }
  lines.push('--------------------------------'); // Empty line
  lines.push(`📢 <b>check our website:</b> https://ropc.vercel.app`);
  lines.push('--------------------------------'); // Empty line

  return lines.join('\n');
}

/**
 * Send a photo to Telegram channel
 */
async function sendPhoto(photoUrl: string, caption?: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('⚠️ TELEGRAM_BOT_TOKEN not configured');
    return false;
  }

  try {
    const channelId = await resolveChannelId();
    // For Telegram, we need to send the photo URL or download it first
    // Telegram accepts URLs for photos, but they must be publicly accessible
    const response = await fetch(`${TELEGRAM_API_BASE}/sendPhoto`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: channelId,
        photo: photoUrl,
        caption: caption || '',
        parse_mode: 'HTML',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Telegram API error:', data);
      console.error(`📱 Channel ID used: ${TELEGRAM_CHANNEL_ID}`);
      console.error(`📱 Bot token exists: ${!!TELEGRAM_BOT_TOKEN}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Error sending photo to Telegram:', error);
    return false;
  }
}

/**
 * Send a media group (multiple photos) to Telegram channel
 */
async function sendMediaGroup(photoUrls: string[], caption?: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('⚠️ TELEGRAM_BOT_TOKEN not configured');
    return false;
  }

  if (photoUrls.length === 0) {
    return false;
  }

  try {
    // Telegram media groups can have up to 10 photos
    const media = photoUrls.slice(0, 10).map((url, index) => ({
      type: 'photo',
      media: url,
      ...(index === 0 && caption ? { caption, parse_mode: 'HTML' } : {}),
    }));

    const channelId = await resolveChannelId();
    const response = await fetch(`${TELEGRAM_API_BASE}/sendMediaGroup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: channelId,
        media: media,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Telegram API error:', data);
      console.error(`📱 Channel ID used: ${TELEGRAM_CHANNEL_ID}`);
      console.error(`📱 Bot token exists: ${!!TELEGRAM_BOT_TOKEN}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Error sending media group to Telegram:', error);
    return false;
  }
}

/**
 * Send a text message to Telegram channel
 */
async function sendMessage(text: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('⚠️ TELEGRAM_BOT_TOKEN not configured');
    return false;
  }

  try {
    const channelId = await resolveChannelId();
    const response = await fetch(`${TELEGRAM_API_BASE}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: channelId,
        text: text,
        parse_mode: 'HTML',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Telegram API error:', data);
      console.error(`📱 Channel ID used: ${TELEGRAM_CHANNEL_ID}`);
      console.error(`📱 Bot token exists: ${!!TELEGRAM_BOT_TOKEN}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Error sending message to Telegram:', error);
    return false;
  }
}

/**
 * Resolve the correct group/channel ID format
 */
async function resolveChannelId(): Promise<string> {
  if (RESOLVED_CHANNEL_ID) {
    return RESOLVED_CHANNEL_ID;
  }

  if (!TELEGRAM_BOT_TOKEN) {
    return TELEGRAM_CHANNEL_ID;
  }

  // Try multiple formats
  const formats: string[] = [];

  if (TELEGRAM_CHANNEL_ID_RAW.startsWith('@')) {
    // If username provided, try that first
    formats.push(TELEGRAM_CHANNEL_ID_RAW);
  } else if (TELEGRAM_CHANNEL_ID_RAW.startsWith('-100')) {
    // If already formatted with -100, use as is
    formats.push(TELEGRAM_CHANNEL_ID_RAW);
    formats.push(`@tattariNET`); // Also try username as fallback
  } else {
    // Try formatted version first, then username, then raw
    const numId = parseInt(TELEGRAM_CHANNEL_ID_RAW);
    if (!isNaN(numId)) {
      formats.push(`-100${numId}`, `@tattariNET`, String(numId));
    } else {
      formats.push(TELEGRAM_CHANNEL_ID);
    }
  }

  const resolvedId = await tryChannelIds(formats);

  if (resolvedId) {
    RESOLVED_CHANNEL_ID = resolvedId;
    return resolvedId;
  }

  // Fallback to original formatted ID
  console.warn(`⚠️ Could not resolve group/channel ID, using: ${TELEGRAM_CHANNEL_ID}`);
  return TELEGRAM_CHANNEL_ID;
}

/**
 * Test if bot can access the channel
 */
async function testChannelAccess(): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    return false;
  }

  try {
    const channelId = await resolveChannelId();
    const response = await fetch(`${TELEGRAM_API_BASE}/getChat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: channelId,
      }),
    });

    const data = await response.json();

    if (data.ok) {
      return true;
    } else {
      console.error(`❌ Bot cannot access channel: ${data.description || 'Unknown error'}`);
      console.error(`💡 Make sure:`);
      console.error(`   1. Bot is added to the channel as an admin`);
      console.error(`   2. Bot has permission to send messages`);
      console.error(`   3. Channel ID is correct: ${channelId}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing channel access:', error);
    return false;
  }
}

/**
 * Send a listing to Telegram channel with images
 */
export async function sendListingToTelegram(listing: ListingData): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('⚠️ TELEGRAM_BOT_TOKEN not configured, skipping Telegram notification');
    return false;
  }

  try {
    // Test channel access first (only log, don't fail)
    await testChannelAccess().catch(() => { });

    const message = formatSpecsMessage(listing);
    const images = listing.images || [];

    // If we have images, send them as a media group with the caption
    if (images.length > 0) {
      const success = await sendMediaGroup(images, message);
      if (success) {
        return true;
      }
    } else {
      // If no images, just send the text message
      const success = await sendMessage(message);
      if (success) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('❌ Error sending listing to Telegram:', error);
    return false;
  }
}

