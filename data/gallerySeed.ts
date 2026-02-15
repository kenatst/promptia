import { GalleryItem, ModelType, ToneType } from '@/types/prompt';
import Colors from '@/constants/colors';

export interface CreationCategory {
  id: string;
  label: string;
  icon: string;
  model: ModelType;
  type: 'text' | 'image' | 'video';
  defaultChips: string[];
  defaultTone: ToneType;
  color: string;
  dimColor: string;
}

export const CREATION_CATEGORIES: CreationCategory[] = [
  { id: 'chat', label: 'Chat', icon: 'message', model: 'chatgpt', type: 'text', defaultChips: ['Explain', 'Analyze'], defaultTone: 'professional', color: Colors.accent, dimColor: Colors.accentDim },
  { id: 'code', label: 'Code', icon: 'code', model: 'chatgpt', type: 'text', defaultChips: ['Debug', 'Generate', 'Review'], defaultTone: 'technical', color: Colors.tertiary, dimColor: Colors.tertiaryDim },
  { id: 'writing', label: 'Writing', icon: 'pen', model: 'chatgpt', type: 'text', defaultChips: ['Write', 'Create'], defaultTone: 'creative', color: Colors.blue, dimColor: Colors.blueDim },
  { id: 'marketing', label: 'Marketing', icon: 'megaphone', model: 'chatgpt', type: 'text', defaultChips: ['Write', 'Optimize'], defaultTone: 'persuasive', color: Colors.pink, dimColor: Colors.pinkDim },
  { id: 'email', label: 'Email', icon: 'mail', model: 'chatgpt', type: 'text', defaultChips: ['Write', 'Plan'], defaultTone: 'professional', color: Colors.yellow, dimColor: Colors.yellowDim },
  { id: 'data', label: 'Data', icon: 'bar-chart', model: 'chatgpt', type: 'text', defaultChips: ['Analyze', 'Summarize'], defaultTone: 'technical', color: Colors.secondary, dimColor: Colors.secondaryDim },
  { id: 'image_art', label: 'Art', icon: 'palette', model: 'midjourney', type: 'image', defaultChips: [], defaultTone: 'creative', color: Colors.secondary, dimColor: Colors.secondaryDim },
  { id: 'photo', label: 'Photo', icon: 'camera', model: 'sdxl', type: 'image', defaultChips: [], defaultTone: 'creative', color: Colors.cyan, dimColor: Colors.cyanDim },
  { id: 'video', label: 'Video', icon: 'film', model: 'video', type: 'video', defaultChips: [], defaultTone: 'creative', color: Colors.pink, dimColor: Colors.pinkDim },
  { id: 'logo', label: 'Logo', icon: 'target', model: 'midjourney', type: 'image', defaultChips: [], defaultTone: 'creative', color: Colors.accent, dimColor: Colors.accentDim },
  { id: 'social', label: 'Social', icon: 'share', model: 'chatgpt', type: 'text', defaultChips: ['Create', 'Write'], defaultTone: 'casual', color: Colors.teal, dimColor: Colors.tealDim },
  { id: 'education', label: 'Education', icon: 'book', model: 'chatgpt', type: 'text', defaultChips: ['Explain', 'Create'], defaultTone: 'academic', color: Colors.blue, dimColor: Colors.blueDim },
  { id: 'seo', label: 'SEO', icon: 'search', model: 'chatgpt', type: 'text', defaultChips: ['Optimize', 'Research'], defaultTone: 'technical', color: Colors.yellow, dimColor: Colors.yellowDim },
  { id: 'translate', label: 'Translate', icon: 'globe', model: 'chatgpt', type: 'text', defaultChips: ['Translate'], defaultTone: 'professional', color: Colors.tertiary, dimColor: Colors.tertiaryDim },
  { id: 'business', label: 'Business', icon: 'briefcase', model: 'chatgpt', type: 'text', defaultChips: ['Plan', 'Analyze'], defaultTone: 'professional', color: Colors.accent, dimColor: Colors.accentDim },
  { id: 'ui_design', label: 'UI Design', icon: 'layout', model: 'midjourney', type: 'image', defaultChips: [], defaultTone: 'creative', color: Colors.cyan, dimColor: Colors.cyanDim },
];

export const gallerySeed: GalleryItem[] = [
  {
    id: 'g1',
    title: 'Cyberpunk City at Dusk',
    prompt: 'A sprawling cyberpunk cityscape at golden hour, neon signs reflecting on wet streets, flying vehicles in the distance, volumetric fog, cinematic composition --ar 16:9 --v 6.1 --q 2',
    tags: ['cyberpunk', 'city', 'cinematic', 'neon'],
    model: 'midjourney',
    type: 'image',
    style: 'Cyberpunk',
    thumbnail: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=400&h=300&fit=crop',
    author: 'PromptMaster',
    likes: 2847,
    isEditorPick: true,
  },
  {
    id: 'g2',
    title: 'Senior Dev Code Reviewer',
    prompt: '## Role\nYou are a senior software engineer with 15+ years experience.\n\n## Task\nReview the following code for bugs, performance issues, security vulnerabilities, and code style.\n\n## Constraints\n- Be specific, reference line numbers\n- Suggest fixes, not just problems\n- Rate severity: critical/major/minor\n\n## Output Format\nStructured markdown with severity badges.',
    tags: ['code-review', 'engineering', 'productivity'],
    model: 'chatgpt',
    type: 'text',
    style: 'Technical',
    thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=300&fit=crop',
    author: 'DevOps_Guru',
    likes: 4192,
    isEditorPick: true,
  },
  {
    id: 'g3',
    title: 'Ethereal Forest Spirit',
    prompt: 'Positive:\nethereal forest spirit emerging from ancient oak tree, bioluminescent particles, mystical atmosphere, ray tracing, subsurface scattering, masterpiece, best quality, 8k\n\nNegative:\nlow quality, blurry, deformed, watermark\n\nSteps: 35 | CFG: 7 | Sampler: DPM++ 2M Karras',
    tags: ['fantasy', 'nature', 'mystical', 'character'],
    model: 'sdxl',
    type: 'image',
    style: 'Fantasy Art',
    thumbnail: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=300&fit=crop',
    author: 'ArtAlchemist',
    likes: 1653,
    isEditorPick: false,
  },
  {
    id: 'g4',
    title: 'Product Launch Email Sequence',
    prompt: '## Role\nYou are a world-class email copywriter specializing in SaaS product launches.\n\n## Task\nWrite a 5-email launch sequence for a new AI writing tool.\n\n## Tone\nConversational yet authoritative. Use storytelling hooks.\n\n## Constraints\n- Each email under 300 words\n- Include subject lines with open-rate optimization\n- CTA in every email\n\n## Output\nMarkdown with clear email separators.',
    tags: ['copywriting', 'email', 'marketing', 'saas'],
    model: 'chatgpt',
    type: 'text',
    style: 'Marketing',
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop',
    author: 'GrowthHacker',
    likes: 3541,
    isEditorPick: true,
  },
  {
    id: 'g5',
    title: 'Drone Through Waterfall Cave',
    prompt: 'Scene: FPV drone shot flying through a hidden cave behind a massive waterfall, revealing a bioluminescent crystal cavern inside\nCamera: fast forward tracking, slight barrel roll on exit\nLighting: natural daylight filtering through water, bioluminescent blue-green glow\nStyle: cinematic, National Geographic quality\nDuration: 4s\nAspect Ratio: 16:9',
    tags: ['nature', 'drone', 'cinematic', 'cave'],
    model: 'video',
    type: 'video',
    style: 'Cinematic',
    thumbnail: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=400&h=300&fit=crop',
    author: 'CinematicAI',
    likes: 2103,
    isEditorPick: false,
  },
  {
    id: 'g6',
    title: 'Minimal Japanese Architecture',
    prompt: 'minimalist Japanese tea house floating on a still lake, morning mist, cherry blossom petals on water surface, wabi-sabi aesthetic, architectural photography, soft diffused light, Hasselblad medium format --ar 3:2 --v 6.1 --q 2 --s 750',
    tags: ['architecture', 'japanese', 'minimal', 'serene'],
    model: 'midjourney',
    type: 'image',
    style: 'Architectural',
    thumbnail: 'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=400&h=300&fit=crop',
    author: 'ZenCreative',
    likes: 3892,
    isEditorPick: true,
  },
  {
    id: 'g7',
    title: 'API Documentation Writer',
    prompt: '## Role\nYou are a technical writer for developer documentation.\n\n## Task\nGenerate comprehensive API documentation for the given endpoints.\n\n## Output Spec\nFor each endpoint:\n- Method + URL\n- Description\n- Parameters table\n- Request/Response examples (JSON)\n- Error codes\n- Rate limits\n\n## Quality\n- OpenAPI 3.0 compatible\n- Include curl examples',
    tags: ['api', 'documentation', 'developer', 'technical'],
    model: 'chatgpt',
    type: 'text',
    style: 'Technical',
    thumbnail: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400&h=300&fit=crop',
    author: 'APIsmith',
    likes: 1987,
    isEditorPick: false,
  },
  {
    id: 'g8',
    title: 'Macro Crystal Formation',
    prompt: 'Positive:\nextreme macro photography of bismuth crystal formation, iridescent rainbow colors, geometric step patterns, shallow depth of field, studio lighting, dark background, masterpiece, best quality, 8k\n\nNegative:\nlow quality, blurry, noise, grain, watermark\n\nSteps: 40 | CFG: 8 | Sampler: Euler a',
    tags: ['macro', 'crystal', 'abstract', 'colorful'],
    model: 'sdxl',
    type: 'image',
    style: 'Photography',
    thumbnail: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&h=300&fit=crop',
    author: 'MacroMind',
    likes: 1245,
    isEditorPick: false,
  },
  {
    id: 'g9',
    title: 'Time-lapse Aurora Borealis',
    prompt: 'Scene: Sweeping time-lapse of northern lights dancing over an Icelandic glacier lagoon with icebergs\nCamera: slow pan left to right, gentle tilt up\nLighting: natural aurora greens and purples reflected in water\nStyle: nature documentary, 8K quality\nDuration: 4s\nAspect Ratio: 21:9',
    tags: ['aurora', 'iceland', 'timelapse', 'nature'],
    model: 'video',
    type: 'video',
    style: 'Documentary',
    thumbnail: 'https://images.unsplash.com/photo-1483347756197-71ef80e95f73?w=400&h=300&fit=crop',
    author: 'NatureAI',
    likes: 2876,
    isEditorPick: true,
  },
  {
    id: 'g10',
    title: 'UI/UX Redesign Consultant',
    prompt: '## Role\nYou are a principal product designer at a FAANG company.\n\n## Task\nAudit and redesign the provided UI screens.\n\n## Process\n1. Identify UX issues (heuristic evaluation)\n2. Suggest information architecture improvements\n3. Propose visual redesign with rationale\n\n## Constraints\n- Follow WCAG 2.1 AA accessibility\n- Design for iOS and Android\n- Mobile-first responsive\n\n## Output\nStructured feedback + design specifications.',
    tags: ['design', 'ux', 'audit', 'mobile'],
    model: 'chatgpt',
    type: 'text',
    style: 'Design',
    thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=300&fit=crop',
    author: 'DesignPro',
    likes: 2234,
    isEditorPick: true,
  },
  {
    id: 'g11',
    title: 'Neon Portrait Photography',
    prompt: 'portrait of a young woman bathed in neon pink and blue light, rain droplets on glass in foreground, bokeh city lights background, moody cinematic color grading, shot on Sony A7III 85mm f/1.4 --ar 2:3 --v 6.1 --q 2 --s 800',
    tags: ['portrait', 'neon', 'moody', 'cinematic'],
    model: 'midjourney',
    type: 'image',
    style: 'Portrait',
    thumbnail: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=300&fit=crop',
    author: 'NeonShooter',
    likes: 3156,
    isEditorPick: false,
  },
  {
    id: 'g12',
    title: 'LinkedIn Content Strategist',
    prompt: '## Role\nYou are a LinkedIn growth expert with 500K+ followers.\n\n## Task\nCreate a 30-day LinkedIn content calendar for a B2B SaaS founder.\n\n## Format\nFor each post:\n- Hook (first line)\n- Body (3-5 short paragraphs)\n- CTA\n- Best posting time\n- Hashtags (5 max)\n\n## Constraints\n- Mix formats: stories, lessons, polls, carousels\n- Include engagement triggers\n- Personal brand voice',
    tags: ['linkedin', 'social', 'content', 'b2b'],
    model: 'chatgpt',
    type: 'text',
    style: 'Social Media',
    thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=300&fit=crop',
    author: 'SocialGrowth',
    likes: 2789,
    isEditorPick: false,
  },
  {
    id: 'g13',
    title: 'Slow Motion Ink in Water',
    prompt: 'Scene: Extreme slow motion of vibrant colored ink drops colliding and dispersing in crystal clear water, creating organic fractal patterns\nCamera: macro close-up, static with slight drift\nLighting: backlit white, high contrast\nStyle: abstract art, 4K slow motion\nDuration: 4s\nMotion: slow expansion, organic tendrils',
    tags: ['abstract', 'slowmo', 'ink', 'art'],
    model: 'video',
    type: 'video',
    style: 'Abstract',
    thumbnail: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&h=300&fit=crop',
    author: 'AbstractAI',
    likes: 1876,
    isEditorPick: true,
  },
];

export const OBJECTIVE_CHIPS = [
  'Write', 'Analyze', 'Generate', 'Explain', 'Summarize',
  'Translate', 'Design', 'Create', 'Review', 'Brainstorm',
  'Debug', 'Optimize', 'Compare', 'Research', 'Plan',
  'Refactor', 'Convert', 'Automate', 'Teach', 'Critique',
];

export const STYLE_CHIPS = [
  'Photorealistic', 'Oil Painting', 'Watercolor', 'Anime',
  'Cyberpunk', 'Fantasy', 'Minimal', 'Abstract', 'Cinematic',
  'Vintage', 'Surreal', 'Pop Art', 'Noir', 'Isometric',
  '3D Render', 'Pixel Art', 'Art Nouveau', 'Flat Design',
];

export const TONE_OPTIONS: { label: string; value: string }[] = [
  { label: 'Professional', value: 'professional' },
  { label: 'Casual', value: 'casual' },
  { label: 'Creative', value: 'creative' },
  { label: 'Technical', value: 'technical' },
  { label: 'Persuasive', value: 'persuasive' },
  { label: 'Academic', value: 'academic' },
];

export const OUTPUT_FORMATS = [
  'Text', 'Markdown', 'JSON', 'HTML', 'CSV', 'Code', 'List', 'Table',
];

export const GALLERY_FILTERS = ['All', 'Text', 'Image', 'Video', 'Editor Picks'];
