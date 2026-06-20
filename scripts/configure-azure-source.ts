import { promises as fs } from 'fs';
import * as path from 'path';

type MetricSourceConfig = {
  source: string;
  enabled: boolean;
  settings: {
    organization?: string;
    project?: string;
    categoryMap: Record<string, { runTitleIncludes: string }>;
  };
};

async function upsertMetricSourceConfig(teamId: string, config: MetricSourceConfig): Promise<void> {
  const configDir = path.join(__dirname, '..', 'data');
  const configPath = path.join(configDir, 'metric-source-configs.json');

  await fs.mkdir(configDir, { recursive: true });

  const existingData = await fs
    .readFile(configPath, 'utf-8')
    .then((content) => JSON.parse(content) as Record<string, MetricSourceConfig>)
    .catch(() => ({} as Record<string, MetricSourceConfig>));

  existingData[teamId] = config;

  await fs.writeFile(configPath, JSON.stringify(existingData, null, 2), 'utf-8');
}

async function run() {
  const teamId = 'team-qa'; // Change this to your target team's ID
  
  const config = {
    source: 'AZURE_DEVOPS',
    enabled: true,
    settings: {
      // If you leave these blank, the server will fall back to process.env.AZURE_DEVOPS_ORG / PROJECT
      organization: process.env.AZURE_DEVOPS_ORG || 'their-org', 
      project: process.env.AZURE_DEVOPS_PROJECT || 'their-project',
      categoryMap: {
        unit: { runTitleIncludes: 'unit' },
        api: { runTitleIncludes: 'api' },
        ui: { runTitleIncludes: 'ui' }
      }
    }
  };

  console.log(`⏳ Saving Azure DevOps config for team: ${teamId}...`);
  
  try {
    await upsertMetricSourceConfig(teamId, config);
    console.log('✅ Success! Metric source configuration saved to database.');
  } catch (error) {
    console.error('❌ Failed to save configuration:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

run();