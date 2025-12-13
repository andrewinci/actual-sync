export type NtfyConfig = {
  url: string;
  topic: string;
};

export const Ntfy = (config: NtfyConfig) => {
  const post = async (params: {
    title: string;
    body: string;
    tags?: string[];
  }) => {
    const headers: Record<string, string> = {
      Title: params.title,
    };
    if (params.tags && params.tags.length > 0) {
      headers.Tags = params.tags.join(",");
    }
    const resp = await fetch(new URL(config.topic, config.url), {
      method: "POST",
      body: params.body,
      headers,
    });
  };
  return { post };
};
