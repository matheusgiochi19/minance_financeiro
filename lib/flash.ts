import { cookies } from "next/headers";

export type FlashType = "success" | "error";

export type FlashMessage = {
  message: string;
  type: FlashType;
};

const FLASH_COOKIE = "minance_flash";

export async function setFlashMessage(type: FlashType, message: string) {
  const store = await cookies();
  store.set(FLASH_COOKIE, JSON.stringify({ message, type } satisfies FlashMessage), {
    httpOnly: true,
    maxAge: 60,
    path: "/",
    sameSite: "lax"
  });
}

export async function getFlashMessage() {
  const store = await cookies();
  const value = store.get(FLASH_COOKIE)?.value;
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<FlashMessage>;
    if (!parsed.message || (parsed.type !== "success" && parsed.type !== "error")) {
      return null;
    }

    return {
      message: parsed.message,
      type: parsed.type
    } satisfies FlashMessage;
  } catch {
    return null;
  }
}

export async function clearFlashMessage() {
  const store = await cookies();
  store.set(FLASH_COOKIE, "", {
    expires: new Date(0),
    httpOnly: true,
    path: "/",
    sameSite: "lax"
  });
}
