export function getOutfitByTemp(temp: number) {
  if (temp >= 28) return "민소매, 반팔, 반바지, 원피스";
  if (temp >= 23) return "반팔, 얇은 셔츠, 반바지";
  if (temp >= 20) return "얇은 가디건, 긴팔, 면바지";
  if (temp >= 17) return "맨투맨, 후드, 긴바지";
  if (temp >= 12) return "자켓, 가디건, 니트";
  if (temp >= 9) return "트렌치코트, 야상, 니트";
  if (temp >= 5) return "코트, 가죽자켓";
  return "패딩, 두꺼운 코트";
}