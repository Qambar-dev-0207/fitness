const { Groq } = require("groq-sdk");
const fs = require("fs");
const path = require("path");

const envFile = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envFile)) {
  const content = fs.readFileSync(envFile, "utf8");
  for (const line of content.split("\n")) {
    const eq = line.indexOf("=");
    if (eq > 0) {
      const k = line.slice(0, eq).trim();
      const v = line.slice(eq + 1).trim();
      if (k === "GROQ_API_KEY") process.env[k] = v;
    }
  }
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function main() {
  try {
    const res = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "What is in this image?" },
            { type: "image_url", image_url: { url: "https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png" } }
          ]
        }
      ],
    });
    console.log("Success:", res.choices[0].message.content);
  } catch (e) {
    console.error("Error:", e.message);
  }
}
main();
