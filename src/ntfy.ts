import chalk from "chalk";

export type NtfyConfig = {
  url: string;
  topic: string;
  username?: string;
  password?: string;
  priority?: 'min' | 'low' | 'default' | 'high' | 'max';
};

export const Ntfy = (config: NtfyConfig) => {
  const post = async (params: {
    title: string;
    body: string;
    tags?: string[];
    priority?: string;
  }) => {
    try {
      // Construct the full URL properly
      const url = config.url.endsWith('/') 
        ? `${config.url}${config.topic}` 
        : `${config.url}/${config.topic}`;
      
      console.log(chalk.blue(`📤 Sending notification to: ${url}`));
      
      const headers: Record<string, string> = {
        'Content-Type': 'text/plain; charset=utf-8',
        'Title': params.title,
        'Priority': params.priority || config.priority || 'default',
      };
      
      if (params.tags && params.tags.length > 0) {
        headers['Tags'] = params.tags.join(',');
      }
      
      // Add authentication if configured
      if (config.username && config.password) {
        const auth = Buffer.from(`${config.username}:${config.password}`).toString('base64');
        headers['Authorization'] = `Basic ${auth}`;
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: params.body,
      });
      
      if (response.ok) {
        console.log(chalk.green(`✅ Notification sent successfully`));
      } else {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error(chalk.red(`❌ Notification failed: ${response.status} ${response.statusText}`));
        console.error(chalk.red(`Response: ${errorText}`));
      }
      
    } catch (error) {
      console.error(chalk.red(`❌ Failed to send notification:`, error));
    }
  };
  
  const test = async () => {
    console.log(chalk.blue('🧪 Sending test notification...'));
    await post({
      title: 'Test Notification',
      body: 'This is a test notification from actual-sync to verify ntfy configuration.',
      tags: ['test', 'actual-sync'],
      priority: 'default'
    });
  };
  
  return { post, test };
};
