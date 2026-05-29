const cheerio = require('cheerio');
const { normalizeYouTubeVideo } = require('./normalizer');
const { TIMEOUTS } = require('../utils/constants');
const logger = require('../utils/logger');

async function scrapeYouTubeTrending(region) {
  logger.info(`Tier 3: Attempting direct YouTube scrape for ${region}`);
  try {
    const url = `https://www.youtube.com/feed/trending?gl=${region}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(TIMEOUTS.YOUTUBE)
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const html = await response.text();
    let ytInitialData = null;

    // Fast Regex Extraction
    const match = html.match(/var\s+ytInitialData\s*=\s*(\{.*?\});\s*<\/script>/s);
    if (match) {
      try {
        ytInitialData = JSON.parse(match[1]);
      } catch (e) {
        logger.warn('Failed to parse ytInitialData from regex, falling back to cheerio');
      }
    }

    // Fallback to Cheerio if Regex fails
    if (!ytInitialData) {
      const $ = cheerio.load(html);
      $('script').each((i, el) => {
        const content = $(el).html();
        if (content && content.includes('var ytInitialData =')) {
          const m = content.match(/var\s+ytInitialData\s*=\s*(\{.*?\});/s);
          if (m) ytInitialData = JSON.parse(m[1]);
        }
      });
    }

    if (!ytInitialData) {
      throw new Error('Could not extract ytInitialData from YouTube HTML');
    }

    // Navigate the complex JSON structure
    const tabs = ytInitialData.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
    const trendingTab = tabs[0];
    
    // The exact path can vary slightly (sectionListRenderer vs richGridRenderer)
    let items = trendingTab?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents?.[0]?.shelfRenderer?.content?.expandedShelfContentsRenderer?.items ||
                trendingTab?.tabRenderer?.content?.richGridRenderer?.contents || [];
                
    if (items.length === 0) {
      // Try another common path
      items = trendingTab?.tabRenderer?.content?.sectionListRenderer?.contents?.flatMap(c => c.itemSectionRenderer?.contents || []) || [];
    }

    // Extract video data
    const videosData = items
      .map(item => {
        let vRenderer = item.videoRenderer; // if it's a direct list
        if (!vRenderer && item.richItemRenderer) {
           vRenderer = item.richItemRenderer.content.videoRenderer;
        }
        return vRenderer;
      })
      .filter(Boolean)
      .map(v => {
        return {
          videoId: v.videoId,
          title: v.title?.runs?.[0]?.text || v.title?.simpleText || '',
          channel: v.shortBylineText?.runs?.[0]?.text || '',
          channelId: v.shortBylineText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId || '',
          views: v.viewCountText?.simpleText || '',
          published: v.publishedTimeText?.simpleText || '',
          duration: v.lengthText?.simpleText || ''
        };
      });

    if (videosData.length === 0) {
       throw new Error('Could not find video items in ytInitialData');
    }
    
    logger.info(`Tier 3: Successfully parsed ${videosData.length} videos from HTML`);
    return {
      videos: videosData.map(normalizeYouTubeVideo),
      source: 'youtube-scrape',
      instance: 'youtube.com'
    };

  } catch (error) {
    logger.error('Tier 3: YouTube scrape failed', { error: error.message });
    throw error;
  }
}

module.exports = { scrapeYouTubeTrending };
