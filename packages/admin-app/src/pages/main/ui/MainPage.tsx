import { useGetCurrentUserQuery } from '@/entities/user/api';
import { Avatar, AvatarFallback, AvatarImage, Spinner } from '@/shared/ui';

export default function Main() {
  const { data: user, isLoading } = useGetCurrentUserQuery();
  const userInitials = user?.displayName
    ?.split(' ')
    .filter(Boolean)
    .map((part) => part[0].toUpperCase())
    .join('');

  if (isLoading) {
    return (
      <section className="w-full h-dvh flex items-center justify-center">
        <Spinner className="size-20" />
      </section>
    );
  }

  return (
    <section className="w-full h-dvh flex flex-col">
      <header className='flex w-full gap-2 items-center'>
        <Avatar>
          <AvatarImage src={user?.avatarUrl || ''}  />
          <AvatarFallback>{userInitials}</AvatarFallback>
        </Avatar>
        <p className='text-xl font-bold'>{user?.displayName}</p>
      </header>
    </section>
  );
}
