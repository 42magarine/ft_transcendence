declare module 'xliff-parser' {
	const parser: {
		parse: (
			xml: string,
			callback: (
				err: Error | null,
				data: {
					resources: {
						[file: string]: {
							[id: string]: {
								source: string;
								target: string;
							};
						};
					};
				}
			) => void
		) => void;
	};

	export = parser;
}
