import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  ConversationTextReferenceChip,
  type ConversationTextReferenceChipItem,
} from '@/components/chat/conversation-text-reference-chip';

const meta = {
  title: 'Chat/ConversationTextReferenceChip',
  component: ConversationTextReferenceChip,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof ConversationTextReferenceChip>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleItem: ConversationTextReferenceChipItem = {
  localId: 'selected-1',
  text: 'The selected conversation excerpt stays attached to the draft until it is removed.',
};

export const Default: Story = {
  args: { item: sampleItem },
};

export const Removable: Story = {
  args: { item: sampleItem },
  render: function RemovableStory() {
    const [items, setItems] = useState([sampleItem]);
    return items.length > 0 ? (
      <ConversationTextReferenceChip
        item={items[0]}
        onRemove={(localId) =>
          setItems((current) => current.filter((item) => item.localId !== localId))
        }
      />
    ) : (
      <p className="text-sm text-muted-foreground">Selected text removed</p>
    );
  },
};
