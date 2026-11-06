export function pageMeta(title: string, description: string) {
  const name = `${title} — EduVerse`;
  return { meta: [
    { title: name },
    { name: "description", content: description },
    { property: "og:title", content: name },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] };
}