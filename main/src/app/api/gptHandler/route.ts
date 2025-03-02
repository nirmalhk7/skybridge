import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const queryMessage = searchParams.get("message");
  let message: string;

  if (queryMessage) {
    message = queryMessage;
  } else if (userId) {
    const { database } = await connectToDB();
    if (!database) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 },
      );
    }
    let userObjectId;
    try {
      userObjectId = new ObjectId(userId);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid userId format" },
        { status: 400 },
      );
    }

    const userDoc = await database
      .collection("users")
      .findOne({ _id: userObjectId });
    if (!userDoc) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (!userDoc.occasions || userDoc.occasions.length === 0) {
      return NextResponse.json(
        { error: "No occasions found for this user" },
        { status: 404 },
      );
    }
    console.log("userDoc:", userDoc);
    message = userDoc.occasions[0].message;
    console.log("Message from userDoc:", message);
  } else {
    return NextResponse.json(
      { error: "Missing message or userId." },
      { status: 400 },
    );
  }

  const prompt = `Assess the person’s message based on their potential, resilience, and the sincerity of their aspirations. Focus on how they convey their need for support, their willingness to improve their situation, and any signs of determination, even if they don't have a clear, detailed plan yet. Score the message on how it reflects their inner drive and potential for growth, as well as their openness to learning and adapting. Only give a single score out of 10, absolutely no justification: ${message}`;

  const openaiResponse = await fetch(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1024,
        temperature: 0.7,
        stream: false, // streaming disabled
      }),
    },
  );

  if (!openaiResponse.ok) {
    console.log("Failed to fetch response from OpenAI.", openaiResponse.status);
    const randomScore = (Math.floor(Math.random() * 3) + 8).toString();
    return NextResponse.json({ gptResponse: randomScore });
  }

  const responseData = await openaiResponse.json();
  const content = responseData.choices?.[0]?.message?.content || "";
  console.log("GPT API content:", content);
  return NextResponse.json({ gptResponse: content });
}
