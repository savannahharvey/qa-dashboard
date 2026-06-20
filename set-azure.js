import { upsertMetricSourceConfig } from './src/db/repository.ts';

async function run() {
  const teamId = 'team-qa';

  const config = {
    source: 'AZURE_DEVOPS',
    enabled: true,
    settings: {
      organization: process.env.AZURE_DEVOPS_ORG || 'their-org',
      project: process.env.AZURE_DEVOPS_PROJECT || 'their-project',
      categoryMap: {
        unit: { runTitleIncludes: 'unit' },
        api: { runTitleIncludes: 'api' },
        ui: { runTitleIncludes: 'ui' },
      },
    },
  };

  console.log(`Saving Azure DevOps config for team: ${teamId}...`);
  await upsertMetricSourceConfig(teamId, config);
  console.log('Success! Metric source configuration saved to database.');
}

run().catch((error) => {
  console.error('Failed to save configuration:', error);
  process.exit(1);
});
