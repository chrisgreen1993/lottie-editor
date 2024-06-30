import { Player, Controls, IPlayerProps } from '@lottiefiles/react-lottie-player'

interface LottiePlayerProps {
  src: IPlayerProps['src']
}


export const LottiePlayer = ({ src }: LottiePlayerProps) => {
  return (
    <Player src={src} autoplay loop className="h-[80vh]">
      <Controls visible />
    </Player>
  )
}