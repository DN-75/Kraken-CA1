// utils/uploadProfilePhoto.ts
import {supabase} from "@/lib/supabaseClient";

export async function uploadProfilePhoto(
    userId: string,
    photoInput: string | Blob
): Promise<string | null> {
    try {
        const blob = typeof photoInput === "string"
            ? await (await fetch(photoInput)).blob()
            : photoInput;

        const ext = blob.type === "image/png" ? "png" : "jpg";
        const filePath = `${userId}/avatar.${ext}`;

        const {error} = await supabase.storage
            .from("profile_images")
            .upload(filePath, blob, {
                upsert: true,
                contentType: blob.type,
            });

        if (error) {
            console.warn("Photo upload failed, continuing without photo:", error.message);
            return null;  // ✅ soft fail — don't throw
        }

        const {data} = supabase.storage
            .from("profile_images")
            .getPublicUrl(filePath);

        if (!data.publicUrl) return null;

        // Prevent stale browser caches when avatar path is reused with upsert.
        return `${data.publicUrl}?t=${Date.now()}`;

    } catch (err) {
        console.warn("Photo upload error, continuing without photo:", err);
        return null;  // ✅ soft fail — don't throw
    }
}