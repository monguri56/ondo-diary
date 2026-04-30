import type { DiaryItem } from "@/lib/diary-db";

function getTodayKey() {
  const today = new Date();

  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(today.getDate()).padStart(2, "0")}`;
}

export function getSampleDiaryItems(): DiaryItem[] {
  return [
    {
      id: "sample-today",
      date: getTodayKey(),
      memo: "가벼운 셔츠에 얇은 니트를 걸쳤더니 실내외 온도 차이에 딱 좋았다.",
      temp: 22,
      weather: "구름 조금",
      image:
        "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: "sample-1",
      date: "2026-04-27",
      memo: "낮에는 따뜻했지만 바람이 있어서 가디건을 챙긴 게 좋았다.",
      temp: 21,
      weather: "맑음",
      image:
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: "sample-2",
      date: "2026-04-24",
      memo: "셔츠 하나만 입기에는 살짝 서늘해서 얇은 자켓을 더했다.",
      temp: 20,
      weather: "흐림",
      image:
        "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: "sample-3",
      date: "2026-04-19",
      memo: "산책하기 좋은 온도. 청바지와 긴팔 조합이 가장 편했다.",
      temp: 23,
      weather: "대체로 맑음",
      image:
        "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: "sample-4",
      date: "2026-04-12",
      memo: "비가 조금 와서 젖어도 부담 없는 신발을 골랐다.",
      temp: 18,
      weather: "이슬비",
      image:
        "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: "sample-hot-1",
      date: "2025-08-18",
      memo: "햇볕이 강해서 린넨 셔츠와 반바지만으로도 충분했다.",
      temp: 33,
      weather: "맑음",
      image:
        "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: "sample-hot-2",
      date: "2025-08-06",
      memo: "민소매 위에 얇은 셔츠를 걸쳤다가 대부분은 벗고 다녔다.",
      temp: 31,
      weather: "대체로 맑음",
      image:
        "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: "sample-hot-3",
      date: "2025-07-24",
      memo: "습하고 더워서 통풍 잘 되는 원피스가 가장 편했다.",
      temp: 29,
      weather: "구름 조금",
      image:
        "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: "sample-warm-1",
      date: "2025-07-02",
      memo: "반팔에 얇은 긴팔 셔츠를 챙겼더니 저녁 바람에도 괜찮았다.",
      temp: 27,
      weather: "맑음",
      image:
        "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: "sample-warm-2",
      date: "2025-06-19",
      memo: "낮에는 반팔, 실내에서는 얇은 가디건이 딱 맞았다.",
      temp: 25,
      weather: "흐림",
      image:
        "https://images.unsplash.com/photo-1520975954732-35dd22299614?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: "sample-warm-3",
      date: "2025-06-07",
      memo: "얇은 셔츠와 면바지 조합이 산책하기 좋았다.",
      temp: 24,
      weather: "구름 조금",
      image:
        "https://images.unsplash.com/photo-1506629905607-d9c297d89170?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: "sample-mild-1",
      date: "2025-05-21",
      memo: "긴팔 티셔츠 하나로 충분했고 해가 지면 가디건이 필요했다.",
      temp: 22,
      weather: "대체로 맑음",
      image:
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: "sample-mild-2",
      date: "2025-05-10",
      memo: "얇은 니트와 청바지가 하루 종일 부담 없었다.",
      temp: 20,
      weather: "맑음",
      image:
        "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: "sample-cool-1",
      date: "2025-04-16",
      memo: "맨투맨 위에 가벼운 자켓을 더하니 아침 공기가 덜 차갑게 느껴졌다.",
      temp: 18,
      weather: "흐림",
      image:
        "https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: "sample-cool-2",
      date: "2025-04-02",
      memo: "후드와 긴바지, 얇은 외투까지 챙기니 저녁까지 편했다.",
      temp: 16,
      weather: "구름 조금",
      image:
        "https://images.unsplash.com/photo-1543076447-215ad9ba6923?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: "sample-cool-3",
      date: "2025-03-24",
      memo: "트렌치코트를 입기 좋은 날씨. 목이 비면 살짝 서늘했다.",
      temp: 14,
      weather: "이슬비",
      image:
        "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: "sample-chilly-1",
      date: "2025-03-10",
      memo: "니트에 자켓을 입고 얇은 머플러를 둘렀더니 딱 좋았다.",
      temp: 12,
      weather: "맑음",
      image:
        "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: "sample-chilly-2",
      date: "2025-02-22",
      memo: "야상 안에 두꺼운 니트를 입으니 바람 부는 날에도 괜찮았다.",
      temp: 10,
      weather: "흐림",
      image:
        "https://images.unsplash.com/photo-1520975661595-6453be3f7070?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: "sample-cold-1",
      date: "2025-02-07",
      memo: "코트만으로는 부족해서 안에 기모 맨투맨을 입었다.",
      temp: 8,
      weather: "구름 조금",
      image:
        "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: "sample-cold-2",
      date: "2025-01-21",
      memo: "가죽자켓보다 울 코트가 더 나았고 장갑도 챙길 만했다.",
      temp: 6,
      weather: "대체로 맑음",
      image:
        "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: "sample-freezing-1",
      date: "2025-01-09",
      memo: "패딩과 목도리가 없으면 힘든 날. 귀까지 덮는 모자가 필요했다.",
      temp: 3,
      weather: "맑음",
      image:
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: "sample-freezing-2",
      date: "2024-12-28",
      memo: "두꺼운 코트 안에 니트를 겹쳐 입고도 손이 시렸다.",
      temp: 0,
      weather: "흐림",
      image:
        "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: "sample-freezing-3",
      date: "2024-12-15",
      memo: "눈이 내려 방수되는 신발과 롱패딩 조합이 가장 안정적이었다.",
      temp: -3,
      weather: "눈",
      image:
        "https://images.unsplash.com/photo-1511138669928-5969761aa0d3?auto=format&fit=crop&w=900&q=80",
    },
  ];
}
