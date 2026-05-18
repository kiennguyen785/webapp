import os
import pickle
import torch
import torch.nn as nn
from torch.nn.utils.rnn import pack_padded_sequence

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
MODEL_DIR = os.path.join(PROJECT_ROOT, "model")


class SimpleLSTM(nn.Module):
    def __init__(self, vocab_size, embed_dim=128, hidden_dim=128):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size + 2, embed_dim, padding_idx=0)
        self.lstm = nn.LSTM(embed_dim, hidden_dim, batch_first=True, num_layers=1)
        self.fc = nn.Linear(hidden_dim, vocab_size + 2)

    def forward(self, x):
        mask = x != 0
        lengths = mask.sum(dim=1)
        lengths = torch.clamp(lengths, min=1)

        x_embed = self.embedding(x)

        packed = pack_padded_sequence(
            x_embed,
            lengths.cpu(),
            batch_first=True,
            enforce_sorted=False
        )

        _, (h, _) = self.lstm(packed)
        return self.fc(h[-1])


def load_pickle(filename):
    path = os.path.join(MODEL_DIR, filename)
    with open(path, "rb") as f:
        return pickle.load(f)


config = load_pickle("config.pkl")
item2idx = load_pickle("item2idx.pkl")
idx2item = load_pickle("idx2item.pkl")

vocab_size = config.get("vocab_size")
embed_dim = config.get("embed_dim", 64)
hidden_dim = config.get("hidden_dim", 128)
max_len = config.get("max_len", 20)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

model = SimpleLSTM(vocab_size, embed_dim, hidden_dim).to(device)

model_path = os.path.join(MODEL_DIR, "model.pth")
state_dict = torch.load(model_path, map_location=device)

model.load_state_dict(state_dict)
model.eval()


def predict_next_items(sequence_item_ids, top_k=20):
    if not sequence_item_ids:
        return []

    seq_idx = []

    for item_id in sequence_item_ids:
        try:
            item_id = int(item_id)
        except:
            pass

        if item_id in item2idx:
            seq_idx.append(item2idx[item_id])

    print("sequence_item_ids =", sequence_item_ids)
    print("seq_idx =", seq_idx)

    if not seq_idx:
        return []

    seq_idx = seq_idx[-max_len:]

    x = torch.tensor([seq_idx], dtype=torch.long).to(device)

    with torch.no_grad():
        logits = model(x)
        top_indices = torch.topk(
            logits,
            k=top_k + len(seq_idx),
            dim=1
        ).indices[0].cpu().tolist()

    seen_items = set(sequence_item_ids)
    recommended_items = []

    for idx in top_indices:
        if idx == 0:
            continue

        item_id = idx2item.get(idx)

        if item_id is None:
            continue

        if item_id in seen_items:
            continue

        recommended_items.append(item_id)

        if len(recommended_items) >= top_k:
            break

    print("recommended_items =", recommended_items)

    return recommended_items
