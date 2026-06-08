"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { ToolFaq } from "@/lib/tool-intelligence";

interface ToolFaqAccordionProps {
  faqs: ToolFaq[];
}

export function ToolFaqAccordion({ faqs }: ToolFaqAccordionProps) {
  return (
    <Accordion type="single" collapsible className="rounded-[24px] border border-neutral-stroke bg-neutral-surface/60 px-5">
      {faqs.map((faq, index) => (
        <AccordionItem key={faq.question} value={`faq-${index}`}>
          <AccordionTrigger className="text-left text-base font-bold text-foreground hover:no-underline">
            {faq.question}
          </AccordionTrigger>
          <AccordionContent className="text-sm leading-7 text-muted-foreground">
            {faq.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
