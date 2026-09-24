declare module "*.css" {
  const content: { [className: string]: string };
  export default content;
}

declare module "@storybook/react" {
  export type Meta<T = any> = any;
  export type StoryObj<T = any> = any;
}

declare module "@storybook/nextjs" {
  export type StorybookConfig = any;
}
