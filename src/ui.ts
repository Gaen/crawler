const prompts = require('prompts');

type Choice = {
  title: string,
  description?: string,
  visible?: boolean,
  action: (() => void) | (() => PromiseLike<void>),
};

export async function select(message: string, choices: Choice[]) {

  const visibleChoices = choices.filter(({visible}) => visible !== false);

  const {value} = await prompts({
    message,
    name: 'value',
    type: 'select',
    choices: visibleChoices.map(({title, description}, index) => ({
      title,
      description,
      value: index,
    })),
  });

  const choice = visibleChoices[value];

  // TODO handle Ctrl+C properly
  if(choice === undefined)
    throw new Error('No choice');

  await choice.action();
}