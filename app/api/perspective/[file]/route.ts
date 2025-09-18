import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET(
  request: NextRequest,
  { params }: { params: { file: string } }
) {
  const filename = params.file

  // Only serve WASM files
  if (!filename.endsWith(".wasm")) {
    return new NextResponse("Not found", { status: 404 })
  }

  try {
    const filePath = path.join(process.cwd(), "public", filename)
    const fileBuffer = fs.readFileSync(filePath)

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/wasm",
        "Cache-Control": "public, max-age=31536000",
      },
    })
  } catch (error) {
    console.error("Error serving WASM file:", error)
    return new NextResponse("File not found", { status: 404 })
  }
}