// /app/profile/components/ProfileHeader.tsx
interface Props {
  user: any;
}

export default function ProfileHeader({ user }: Props) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <img
        src={user.profileImageUrl || "/placeholder-avatar.png"}
        alt={user.fullName}
        className="w-20 h-20 rounded-full object-cover"
      />
      <div>
        <h1 className="text-2xl font-bold">{user.fullName}</h1>
        <p className="text-gray-500">{user.email}</p>
      </div>
    </div>
  );
}