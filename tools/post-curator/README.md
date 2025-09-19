# ThreadGuessr Post Curator

An automated tool for curating Reddit posts for the ThreadGuessr game. This tool fetches random posts from whitelisted subreddits and provides an interface for approving/rejecting posts that will be added to the game.

## Features

- 🎯 **Smart Post Fetching**: Automatically fetches posts from your whitelisted subreddits
- 🎮 **Game Preview**: Shows exactly how the post will appear in the game
- ⚡ **Quick Curation**: Simple approve/reject/skip interface with quality indicators
- 📊 **Progress Tracking**: Real-time stats on approved posts and batch progress
- 💾 **Batch Export**: Export approved posts to JSON format for integration
- ⌨️ **Keyboard Shortcuts**: Fast curation with A/R/S keys
- 🔍 **Quality Filters**: Automatic filtering for score, media quality, and content rating

## Setup

### 1. Reddit API Setup

First, you need Reddit API credentials:

1. Go to https://www.reddit.com/prefs/apps
2. Click "Create App" or "Create Another App"
3. Choose "script" as the app type
4. Fill in:
   - **Name**: ThreadGuessr Curator
   - **App type**: script
   - **Description**: Post curation tool for ThreadGuessr
   - **About URL**: (leave blank)
   - **Redirect URI**: http://localhost:8080 (required but not used)

4. Copy the Client ID (under the app name) and Client Secret

### 2. Environment Configuration

1. Copy the environment template:
   ```bash
   cp .env .env
   ```

2. Edit `.env` and add your Reddit credentials:
   ```env
   REDDIT_CLIENT_ID=your_client_id_here
   REDDIT_CLIENT_SECRET=your_client_secret_here
   REDDIT_USERNAME=your_reddit_username
   REDDIT_PASSWORD=your_reddit_password
   ```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start the Application

```bash
npm run dev
```

This will start:
- Backend server on http://localhost:3001
- Frontend interface on http://localhost:3000

## Usage

### Basic Workflow

1. **Start a New Batch**: Click "Start New Batch" to fetch 20 random posts
2. **Review Posts**: Each post is displayed as it would appear in the game
3. **Make Decisions**: Use the buttons or keyboard shortcuts:
   - **A** = Approve (add to game)
   - **R** = Reject (not suitable)
   - **S** = Skip (maybe later)
4. **Export Results**: When finished, export approved posts to JSON
5. **Import to Game**: Copy the exported seeds to your main game's seeds.json

### Quality Guidelines

Approve posts that have:
- ✅ Clear, high-quality images or videos
- ✅ Strong association with the subreddit (not generic content)
- ✅ Good engagement (high score)
- ✅ Appropriate content rating for your game
- ✅ Descriptive but not overly long titles

Reject posts that:
- ❌ Have poor image quality or broken media
- ❌ Could belong to multiple subreddits (too generic)
- ❌ Have very low engagement
- ❌ Are NSFW when inappropriate
- ❌ Have misleading or clickbait titles

### Keyboard Shortcuts

- **A** - Approve post
- **R** - Reject post
- **S** - Skip post
- **Space** - Scroll down to see more of the post

## File Structure

```
post-curator/
├── src/
│   ├── components/
│   │   ├── PostCard.tsx         # Game-style post preview
│   │   ├── CurationInterface.tsx # Approve/reject buttons
│   │   └── BatchControls.tsx    # Batch management
│   ├── types.ts                 # TypeScript definitions
│   └── App.tsx                  # Main application
├── server/
│   ├── reddit-service.ts        # Reddit API integration
│   └── index.ts                 # Express server
└── output/                      # Exported seeds go here
    └── approved-seeds-*.json
```

## API Endpoints

The backend provides these endpoints:

- `GET /api/batch` - Fetch new batch of posts
- `GET /api/current` - Get current post for review
- `POST /api/curate` - Submit approval decision
- `GET /api/stats` - Get curation statistics
- `POST /api/export` - Export approved seeds to JSON
- `POST /api/clear` - Clear current session

## Configuration

### Filtering Criteria

The tool automatically filters posts based on:

- **Minimum score**: 100 upvotes (configurable in reddit-service.ts)
- **Content type**: Must have images or videos
- **Post type**: No text-only posts
- **Stickied posts**: Excluded
- **Title length**: 10-300 characters

### Batch Size

Default batch size is 20 posts. You can modify this in the server code:

```typescript
// In server/index.ts
currentBatch = await redditService.fetchRandomPosts(20); // Change this number
```

## Integration with Main Game

### Method 1: Direct Integration

1. Export approved seeds from the curator
2. Copy the JSON content
3. Append to your main game's `src/data/seeds.json`

### Method 2: Automated Integration

You could extend the tool to automatically append to the main seeds.json:

```typescript
// Add this to the export endpoint
const mainSeedsPath = path.join(__dirname, '../../../src/data/seeds.json');
const existingSeeds = JSON.parse(await fs.readFile(mainSeedsPath, 'utf-8'));
const mergedSeeds = [...existingSeeds, ...approvedSeeds];
await fs.writeFile(mainSeedsPath, JSON.stringify(mergedSeeds, null, 2));
```

## Tips for Efficient Curation

1. **Set a Goal**: Aim for 50-100 approved posts per session
2. **Quality over Quantity**: Be selective - better to have fewer high-quality posts
3. **Regular Exports**: Export every 20-30 approvals to avoid losing work
4. **Batch Variety**: Run multiple batches to get diverse content
5. **Monitor Stats**: Keep an eye on your approval rate (aim for 20-40%)

## Troubleshooting

### Reddit API Issues

- **Rate Limiting**: If you get 429 errors, wait a few minutes before retrying
- **Authentication**: Double-check your credentials in `.env`
- **Permissions**: Make sure your Reddit account has sufficient karma/age

### No Posts Loading

- Check that the main game's whitelist.json exists and is valid
- Verify the whitelist path in server/index.ts
- Ensure subreddits in whitelist are active and have recent posts

### Media Not Loading

- Some Reddit images/videos may be blocked by CORS
- The tool shows a fallback when media fails to load
- This won't affect the exported data, only the preview

## Development

### Adding New Features

The codebase is modular and easy to extend:

- **New filters**: Modify `isGoodCandidate()` in reddit-service.ts
- **UI improvements**: Components are in src/components/
- **Additional metadata**: Extend the CurationCandidate type
- **Different export formats**: Modify the export endpoint

### Building for Production

```bash
npm run build
npm run build:server
```

## License

This tool is part of the ThreadGuessr project and follows the same license terms.
