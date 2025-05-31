// File: frontend/components/Matchup.ts
import type { ContentBlock, MatchupProps } from '../../interfaces/componentInterfaces.js';

type RenderContentBlockFn = (block: ContentBlock) => Promise<string>;

export default async function renderMatchup(
	props: MatchupProps,
	renderContentBlock: RenderContentBlockFn
): Promise<string>
{
	const player1Html = await renderContentBlock(props.player1);
	const player2Html = await renderContentBlock(props.player2);

	return `
		<div class="lobby-center text-center">
			${player1Html}
			<div class="vs my-2 font-bold text-lg">VS</div>
			${player2Html}
		</div>`;
}
