export type NtfyConfig = {
  url: string;
  topic: string;
};

export const Ntfy = (config: NtfyConfig) => {
  const post = async (params: { title: string; body: string }) => {
    const resp = await fetch(new URL(config.topic, config.url), {
      method: "POST",
      body: params.body,
      headers: {
        Title: params.title,
      },
    });
  };
  return { post };
};
