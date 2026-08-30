import Image from 'next/image';
import { displayName } from '@/shared/utils/format';
import { initials } from '@/shared/utils/ui';

type AvatarPropsType = {
    name: string | null | undefined;
    steamId: string;
    src?: string | null;
    size?: 'small' | 'medium' | 'large';
};

const sizes = { small: 32, medium: 44, large: 64 } satisfies Record<NonNullable<AvatarPropsType['size']>, number>;

export function Avatar({ name, steamId, src, size = 'medium' }: AvatarPropsType) {
    const label = displayName(name, steamId);
    const dimension = sizes[size];
    const style = {
        width: dimension,
        height: dimension,
        fontSize: dimension / 3.4,
    };

    return src ? (
        <Image
            className="inline-grid shrink-0 rounded-full border border-(--line) object-cover"
            src={src}
            alt={label}
            width={dimension}
            height={dimension}
            style={style}
        />
    ) : (
        <span
            className="grid shrink-0 place-items-center rounded-full border border-(--line) bg-(--panel-raised) font-extrabold text-(--purple)"
            role="img"
            aria-label={label}
            style={style}
        >
            {initials(label)}
        </span>
    );
}
