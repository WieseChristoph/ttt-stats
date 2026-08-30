type EmptyStatePropsType = { title: string; message: string };

export function EmptyState({ title, message }: EmptyStatePropsType) {
    return (
        <div className="grid gap-2 px-3.75 py-9 text-center text-(--muted)">
            <strong className="text-(--text)">{title}</strong>
            <span>{message}</span>
        </div>
    );
}
