import { ChatsModel } from "../db/models/ChatsModel.js";
import { CharacterModel } from "../db/models/CharacterModel.js";
import { UserModel } from "../db/models/UserModel.js";
export async function listChatsByUser(req, res) {
    try {
        const userId = req.params.userId;
        const chats = await ChatsModel.find({ userId });
        const enriched = await Promise.all(chats.map(async (chat) => {
            const character = await CharacterModel.findById(chat.characterId).lean();
            return {
                ...chat.toObject(),
                character,
            };
        }));
        res.json(enriched);
    }
    catch (err) {
        console.error("listChatsByUser error:", err);
        res.status(500).json({ message: "Failed to fetch chats" });
    }
}
export async function createChat(req, res) {
    try {
        const { userId, characterId, lastMessage } = req.body;
        if (!userId || !characterId) {
            return res.status(400).json({ message: "Missing userId or characterId" });
        }
        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (user.coins < 1) {
            return res.status(403).json({ message: "Insufficient coins" });
        }
        user.coins -= 1;
        await user.save();
        const newChat = new ChatsModel({
            userId,
            characterId,
            lastMessage: lastMessage || "",
        });
        await newChat.save();
        res.status(201).json(newChat);
    }
    catch (err) {
        console.error("createChat error:", err);
        res.status(500).json({ message: "Failed to create chat" });
    }
}
