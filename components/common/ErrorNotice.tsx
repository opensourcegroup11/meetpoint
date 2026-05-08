type ErrorNoticeProps = {
  message: string;
};

export default function ErrorNotice({ message }: ErrorNoticeProps) {
  return (
    <p role="alert" className="text-sm text-red-500">
      {message}
    </p>
  );
}
