type Picture = import('vite-imagetools').Picture

declare module '*as=picture' {
  const src: Picture
  export default src
}
