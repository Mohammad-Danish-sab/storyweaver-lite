from fastapi import APIRouter, HTTPException
from typing import List, Optional
from app.schemas.story import StorySchema

router = APIRouter()


def make_story(story_id, title_en, title_kn, category, level, image, published_at, trend_score, pages, pages_kn=None):
    return {
        "id": story_id, "title_en": title_en, "title_kn": title_kn,
        "category": category, "level": level, "cover_image": image,
        "published_at": published_at, "trend_score": trend_score,
        "pages": [
            {"page_number": index + 1, "text_en": text,
             "text_kn": pages_kn[index] if pages_kn else text,
             "image_url": image, "audio_url_kn": None}
            for index, text in enumerate(pages)
        ],
    }


STORIES_DB: List[dict] = [
    make_story("story-001", "The Clever Fox & The Forest", "ಚಾಣಾಕ್ಷ ನರಿ ಮತ್ತು ಕಾಡು", "animals", 1,
        "https://images.unsplash.com/photo-1534567153574-2b12153a87f0?auto=format&fit=crop&w=900&q=85", "2026-10-12", 98,
        ["In a sunlit forest, Firoz the fox woke to find that the river had dried into a ribbon of stones. Every animal was worried, because the mango grove on the far bank was the only place with water.", "Firoz noticed a line of strong vines hanging from an old banyan tree. Instead of trying to jump the river alone, he asked the monkeys to braid the vines into a bridge and the elephants to hold it steady.", "One by one, the animals crossed safely. Firoz learned that clever ideas become even stronger when everyone helps. From that day, the forest friends shared both the mangoes and the water."]),
    make_story("story-002", "The Golden Fish", "ಚಿನ್ನದ ಮೀನು", "folktales", 2,
        "https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=900&q=85", "2026-10-10", 91,
        ["Maya, a young fisher, found a shimmering golden fish caught in her net. Its scales looked like little pieces of the morning sun.", "The fish promised Maya a wish if she set it free. Maya thought of a grand house, but then remembered her neighbours whose boats were broken after a storm.", "She wished for every family to have a safe boat. The lake glittered, and by sunrise the shore was full of repaired boats. Maya discovered that the best wishes make room for everyone."]),
    make_story("story-003", "The Kite That Found the Wind", "ಗಾಳಿಯನ್ನು ಕಂಡ ಗಾಳಿಪಟ", "friendship", 1,
        "https://images.unsplash.com/photo-1503220317375-aaad61436b1b?auto=format&fit=crop&w=900&q=85", "2026-10-15", 88,
        ["Ravi made a bright blue kite, but it would not fly. Each time he ran, it bumped softly along the dusty schoolyard.", "His friend Asha watched the trees. She showed Ravi how to wait for a breeze and how to let the string out slowly instead of pulling hard.", "Soon the kite danced high above the rooftops. Ravi thanked Asha and tied a tiny yellow ribbon to the tail, so their friendship would fly with it."]),
    make_story("story-004", "The Seed in the Cracked Pot", "ಒಡೆದ ಮಡಕೆಯ ಬೀಜ", "nature", 1,
        "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=900&q=85", "2026-10-16", 84,
        ["Grandmother used an old pot with a long crack to carry water from the well. By the time she came home, half the water had spilled away.", "The pot felt ashamed, but Grandmother smiled and asked it to look along the path. Wildflowers were growing wherever the drops had fallen.", "She had placed seeds beside the path months ago, knowing the cracked pot would water them. The pot understood that even an imperfect thing can bring beauty to the world."]),
    make_story("story-005", "Meera and the Moon Map", "ಮೀರಾಳ ಚಂದ್ರನ ನಕ್ಷೆ", "science", 2,
        "https://images.unsplash.com/photo-1532693322450-2cb5c511067d?auto=format&fit=crop&w=900&q=85", "2026-10-14", 95,
        ["Meera saw a silver moon with dark patches and wondered if they were shadows from mountains. She began drawing the moon every evening in a small notebook.", "After a month, Meera noticed the same shapes returned again and again. Her teacher explained that they were wide plains on the moon, called maria, formed long ago by lava.", "Meera made a moon map for the library wall. Her careful looking turned a question into discovery, and soon other children brought their own sky notebooks."]),
    make_story("story-006", "The Rain Drum", "ಮಳೆಯ ಡೋಲು", "folktales", 2,
        "https://images.unsplash.com/photo-1519692933481-e162a57d6721?auto=format&fit=crop&w=900&q=85", "2026-10-08", 76,
        ["For many hot weeks, the village waited for rain. Young Kavi found an old clay drum in the attic and gently cleaned its dusty skin.", "At sunset, Kavi played a slow rhythm outside. Neighbours brought pots, pans, and bells, and together they made a song that rolled across the fields.", "The rain came that night, not because of magic, but because the whole village had remembered to hope and work together. They collected every drop in clean water tanks."]),
    make_story("story-007", "Nila the Night Owl", "ನೀಲಾ ರಾತ್ರಿ ಗೂಬೆ", "animals", 1,
        "https://images.unsplash.com/photo-1543549790-8b5f4a0e45e6?auto=format&fit=crop&w=900&q=85", "2026-10-17", 100,
        ["Nila was the youngest owl in the grove and was nervous about flying at night. The moon made every branch look like a dancing shadow.", "Her grandmother taught her to listen first: to the leaves, to the quiet wings, and to the soft call of friends. Nila followed the sounds instead of fearing the dark.", "By dawn, Nila had found her way home and even helped a lost beetle find its leaf. Brave does not mean never being afraid; it means taking one gentle step at a time."]),
    make_story("story-008", "The Little Library Bus", "ಚಿಕ್ಕ ಗ್ರಂಥಾಲಯ ಬಸ್", "community", 1,
        "https://images.unsplash.com/photo-1494515843206-f3117d3f51b7?auto=format&fit=crop&w=900&q=85", "2026-10-13", 86,
        ["A yellow bus arrived in a village every Friday carrying shelves of books instead of passengers. Children called it the Little Library Bus.", "When the bridge flooded, the bus could not arrive. So the children packed their favourite books into baskets and walked them to elders who were waiting for stories.", "The librarian was delighted. The children had discovered that a library is not only a building or a bus. It is people sharing stories wherever they are."]),
    make_story("story-009", "The Garden of Little Helpers", "ಪುಟ್ಟ ಸಹಾಯಕರ ತೋಟ", "nature", 1,
        "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=900&q=85", "2026-10-17", 79,
        ["Anu found a patch of dry earth behind her school. She and her classmates planted beans, marigolds, and a row of tiny tomato seeds.", "Each child took a turn watering the garden. They watched ladybirds visit the leaves and learned that worms help keep the soil healthy.", "When the first tomatoes ripened, the children shared them with the school cook. Their little garden had grown because everyone cared for it together."],
        ["ಅನು ತನ್ನ ಶಾಲೆಯ ಹಿಂದೆ ಒಣಗಿದ್ದ ಒಂದು ಜಾಗವನ್ನು ಕಂಡಳು. ಅವಳು ಮತ್ತು ಅವಳ ಗೆಳೆಯರು ಅಲ್ಲಿ ಬೀನ್ಸ್, ಚೆಂಡುಹೂವು ಮತ್ತು ಪುಟ್ಟ ಟೊಮೆಟೊ ಬೀಜಗಳನ್ನು ನೆಟ್ಟರು.", "ಪ್ರತಿ ಮಗು ಸರದಿಯಂತೆ ತೋಟಕ್ಕೆ ನೀರು ಹಾಕಿತು. ಎಲೆಗಳ ಮೇಲೆ ಓಡಾಡುವ ಕೆಂಪು ಚುಕ್ಕೆಗಳ ಲೇಡಿಬರ್ಡ್‌ಗಳನ್ನು ನೋಡಿ, ಎರೆಹುಳುಗಳು ಮಣ್ಣಿಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡುತ್ತವೆ ಎಂದು ಕಲಿತರು.", "ಮೊದಲ ಟೊಮೆಟೊಗಳು ಹಣ್ಣಾದಾಗ, ಮಕ್ಕಳು ಅವುಗಳನ್ನು ಶಾಲೆಯ ಅಡುಗೆಯವರೊಂದಿಗೆ ಹಂಚಿಕೊಂಡರು. ಎಲ್ಲರೂ ಕಾಳಜಿ ವಹಿಸಿದ್ದರಿಂದ ಅವರ ಪುಟ್ಟ ತೋಟ ಬೆಳೆದಿತ್ತು."]),
    make_story("story-010", "Tara and the Talking Stars", "ಮಾತನಾಡುವ ನಕ್ಷತ್ರಗಳು ಮತ್ತು ತಾರಾ", "science", 2,
        "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=900&q=85", "2026-10-17", 73,
        ["One clear night, Tara spread a blanket on the roof and looked up at the stars. She wondered why some seemed brighter than others.", "Her uncle showed her how to find a bright group of stars and explained that stars are distant suns. Some look brighter because they are closer or bigger.", "Tara drew the patterns in her notebook. The sky still held many mysteries, but now she knew how to begin looking for answers."],
        ["ಒಂದು ನಿರ್ಮಲ ರಾತ್ರಿಯಲ್ಲಿ ತಾರಾ ಮನೆಯ ಮೇಲ್ಛಾವಣಿಯಲ್ಲಿ ಹಾಸಿಗೆ ಹಾಸಿ ನಕ್ಷತ್ರಗಳನ್ನು ನೋಡಿದಳು. ಕೆಲವು ನಕ್ಷತ್ರಗಳು ಏಕೆ ಹೆಚ್ಚು ಹೊಳೆಯುತ್ತವೆ ಎಂದು ಅವಳು ಯೋಚಿಸಿದಳು.", "ಅವಳ ಚಿಕ್ಕಪ್ಪ ಹೊಳೆಯುವ ನಕ್ಷತ್ರಗಳ ಗುಂಪನ್ನು ತೋರಿಸಿ, ನಕ್ಷತ್ರಗಳೂ ದೂರದಲ್ಲಿರುವ ಸೂರ್ಯಗಳೇ ಎಂದು ವಿವರಿಸಿದರು. ಕೆಲವು ನಕ್ಷತ್ರಗಳು ಹತ್ತಿರವಾಗಿರುವುದರಿಂದ ಅಥವಾ ದೊಡ್ಡದಾಗಿರುವುದರಿಂದ ಹೆಚ್ಚು ಹೊಳೆಯುತ್ತವೆ.", "ತಾರಾ ಆಕಾಶದ ನಕ್ಷೆಗಳನ್ನು ತನ್ನ ಪುಸ್ತಕದಲ್ಲಿ ಚಿತ್ರಿಸಿದಳು. ಆಕಾಶದಲ್ಲಿ ಇನ್ನೂ ಅನೇಕ ರಹಸ್ಯಗಳಿದ್ದವು, ಆದರೆ ಉತ್ತರಗಳನ್ನು ಹುಡುಕುವುದು ಹೇಗೆಂದು ಅವಳಿಗೆ ತಿಳಿದಿತ್ತು."]),
    make_story("story-011", "The Bridge of Kind Words", "ಒಳ್ಳೆಯ ಮಾತುಗಳ ಸೇತುವೆ", "friendship", 1,
        "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?auto=format&fit=crop&w=900&q=85", "2026-10-17", 68,
        ["Kabir and Leela both wanted to use the same red crayon for their drawings. They frowned and turned their backs on each other.", "Their teacher asked them to explain what they needed. Kabir wanted to draw a sunset, and Leela needed the crayon for a bright kite.", "They agreed to take turns and added both pictures to the class wall. A few kind words had built a bridge between two friends."],
        ["ಕಬೀರ್ ಮತ್ತು ಲೀಲಾ ಇಬ್ಬರಿಗೂ ತಮ್ಮ ಚಿತ್ರ ಬಿಡಿಸಲು ಒಂದೇ ಕೆಂಪು ಬಣ್ಣದ ಪೆನ್ಸಿಲ್ ಬೇಕಿತ್ತು. ಇಬ್ಬರೂ ಬೇಸರದಿಂದ ಒಬ್ಬರಿಗೊಬ್ಬರು ಬೆನ್ನು ತಿರುಗಿಸಿದರು.", "ಶಿಕ್ಷಕರು ತಮಗೆ ಏನು ಬೇಕೆಂದು ಹೇಳಲು ಕೇಳಿದರು. ಕಬೀರ್ ಸೂರ್ಯಾಸ್ತದ ಚಿತ್ರ ಬಿಡಿಸಲು ಬಯಸಿದರೆ, ಲೀಲಾ ಬಣ್ಣದ ಗಾಳಿಪಟ ಬಿಡಿಸಲು ಬಯಸಿದ್ದಳು.", "ಅವರು ಸರದಿಯಲ್ಲಿ ಪೆನ್ಸಿಲ್ ಬಳಸಲು ಒಪ್ಪಿಕೊಂಡರು ಮತ್ತು ಎರಡೂ ಚಿತ್ರಗಳನ್ನು ತರಗತಿಯ ಗೋಡೆಯ ಮೇಲೆ ಹಾಕಿದರು. ಕೆಲವು ಒಳ್ಳೆಯ ಮಾತುಗಳು ಇಬ್ಬರು ಗೆಳೆಯರ ನಡುವೆ ಸೇತುವೆ ಕಟ್ಟಿದವು."]),
]


@router.get("/stories", response_model=List[StorySchema])
def get_stories(category: Optional[str] = None, level: Optional[int] = None):
    results = STORIES_DB
    if category and category != "all":
        results = [story for story in results if story["category"] == category]
    if level:
        results = [story for story in results if story["level"] == level]
    return results


@router.get("/stories/{story_id}", response_model=StorySchema)
def get_story(story_id: str):
    story = next((story for story in STORIES_DB if story["id"] == story_id), None)
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    return story
