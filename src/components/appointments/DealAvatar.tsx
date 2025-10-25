import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface DealAvatarProps {
  name: string;
  className?: string;
}

export function DealAvatar({ name, className }: DealAvatarProps) {
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getColorFromName = (name: string) => {
    const colors = [
      'bg-blue-500',
      'bg-purple-500',
      'bg-green-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
      'bg-cyan-500',
    ];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <Avatar className={className}>
      <AvatarFallback className={`${getColorFromName(name)} text-white text-xs font-medium`}>
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
