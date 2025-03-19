'use client';

import classNames from 'classnames';
import { useInView } from 'framer-motion';
import { Children, type ReactNode, type TransitionEvent, useEffect, useRef } from 'react';

import styles from './split-text.module.scss';

interface SplitTextProps {
	children: ReactNode; // might be restricted to only string
	className?: string;
	separator?: string; // probs western/latin langs only
}

function onTransitionEnd(e: TransitionEvent<HTMLDivElement>) {
	e.currentTarget.style.setProperty('--complete', '1');
}

export function SplitText({ children, className, separator = ' ' }: SplitTextProps) {
	const ref = useRef<HTMLDivElement>(null);
	const inView = useInView(ref, { once: true, margin: '-15% 0%' });

	useEffect(() => {
		if (!inView || !ref.current) {
			return;
		}

		let tid: ReturnType<typeof setTimeout>;
		const onResize = () => {
			clearTimeout(tid);
			tid = setTimeout(() => {
				let lineIndex = 0;
				let wordIndex = 0;
				let wordLineIndex = 0;
				let lastY = ref.current ? ref.current.children[0].getBoundingClientRect().y : null;

				for (const i of ref.current?.children || []) {
					const element = i as HTMLElement;
					const box = i.getBoundingClientRect();

					if (lastY !== null && lastY < box.y) {
						lineIndex++;
						wordLineIndex = 0;
					} else {
						wordLineIndex++;
					}

					element.style.setProperty('--line-index', lineIndex.toString());
					element.style.setProperty('--word-index', wordIndex.toString());
					element.style.setProperty('--line-word-index', wordLineIndex.toString());
					element.style.setProperty('--ready', '1');

					lastY = box.y;
					wordIndex++;
				}
			}, 200);
		};

		window.addEventListener('resize', onResize);

		onResize();

		return () => {
			window.removeEventListener('resize', onResize);
		};
	}, [inView]);

	return (
		<div
			className={classNames(styles.splitText, className)}
			ref={ref}
			role="presentation"
			aria-hidden
		>
			{/* eslint-disable-next-line react/no-children-map */}
			{Children.map(children, (child, index) => {
				// primitive values are split by space
				if (typeof child === 'string' || typeof child === 'number' || typeof child === 'boolean') {
					return child.toString()
						.trim()
						.replace(/\s*[\r\n]\s*/g, separator) // thanks chatgpt
						.split(separator)
						.map((i, index) => ({ text: i, id: index }))
						.map(({ id, text }) => {
							return (
								<div
									key={id}
									onTransitionEnd={onTransitionEnd}
								>
									{text}
								</div>
							);
						});
				}

				// other elements are wrapped and left as is
				return (
					<div
						// eslint-disable-next-line react/no-array-index-key
						key={index}
						onTransitionEnd={onTransitionEnd}
					>
						{child}
					</div>
				);
			})}
		</div>
	);
}
