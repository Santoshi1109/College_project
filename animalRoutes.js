app.post("/api/animals", async (req, res) => {
    try {
        const newAnimal = new Animal({
            name: req.body.name,
            category: req.body.category,
            about: req.body.about,
            gender: req.body.gender,
            description: req.body.description,
            image: req.body.image
        });

        await newAnimal.save();
        res.status(201).json(newAnimal);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put("/api/animals/:id", async (req, res) => {
  try {
    await Animal.findByIdAndUpdate(req.params.id, req.body);
    res.json({ message: "Animal updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error updating animal" });
  }
});
