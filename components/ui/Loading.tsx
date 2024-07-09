import { Skeleton } from "./Skeleton";

interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  isLoading: boolean;
  skeleton?: React.ReactNode;
}

export const Loading = ({
  isLoading,
  children,
  skeleton,
  ...props
}: LoadingProps) => {
  const SkeletonComponent = skeleton || <Skeleton {...props} />;
  return isLoading ? SkeletonComponent : children;
};
