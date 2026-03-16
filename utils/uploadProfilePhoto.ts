// utils/uploadProfilePhoto.ts
import {supabase} from "@/lib/supabaseClient";

export async function uploadProfilePhoto(
    userId: string,
    photoObjectUrl: string
): Promise<string | null> {
    try {
        const res = await fetch(photoObjectUrl);
        const blob = await res.blob();

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

        return data.publicUrl ?? null;

    } catch (err) {
        console.warn("Photo upload error, continuing without photo:", err);
        return null;  // ✅ soft fail — don't throw
    }
}