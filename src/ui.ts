const prompts = require('prompts');

type Choice = {
  title: string,
  description?: string,
  action: (() => void) | (() => PromiseLike<void>),
};

export async function select(message: string, choices: Choice[]) {

  const {value} = await prompts({
    message,
    name: 'value',
    type: 'select',
    choices: choices.map(({title, description}, index) => ({
      title,
      description,
      value: index,
    })),
  });

  const choice = choices[value];

  // TODO handle Ctrl+C properly
  if(choice === undefined)
    throw new Error('No choice');

  await choice.action();
}