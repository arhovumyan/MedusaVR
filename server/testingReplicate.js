import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

async function runModel() {
  const input = {
    prompt: "what is react"
  };

  // Stream responses as they come
  for await (const event of replicate.stream(
    "meta/meta-llama-3-8b-instruct",
    { input }
  )) {
    process.stdout.write(event.toString());
  }
}

runModel().catch(console.error);

