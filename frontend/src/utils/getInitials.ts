// Iniciais do primeiro e último nome (ex.: "Maria da Silva" -> "MS")
export const getInitials = (name: string | undefined) => {
  if (!name) return '?';
  const names = name.trim().split(' ');
  return names.length >= 2
    ? (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase()
    : names[0].charAt(0).toUpperCase();
};
